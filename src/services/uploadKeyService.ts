import { supabase } from "@/integrations/supabase/client";
import type { UploadKey } from "@/types";

function generateRawKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "gpai_upl_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function keyToPrefix(rawKey: string): string {
  return rawKey.slice(0, 12) + "****";
}

/**
 * Client-side SHA-256 hash of the raw key.
 * NOTE: This is a temporary implementation. Key generation and hashing
 * will be moved to a backend Edge Function for production security.
 */
async function hashKey(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function listUploadKeys(): Promise<UploadKey[]> {
  const { data, error } = await supabase
    .from("upload_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    key_prefix: row.key_prefix,
    created_at: row.created_at,
    last_used_at: row.last_used_at ?? null,
    revoked_at: row.revoked_at ?? null,
    active: !row.revoked_at,
  }));
}

/**
 * Creates an upload key.
 * TEMPORARY: Key generation happens client-side. This will be replaced
 * by an Edge Function that generates and hashes the key server-side.
 * The raw key is NEVER stored in the database — only the hash and prefix.
 */
export async function createUploadKey(
  name: string
): Promise<{ key: UploadKey; rawKey: string }> {
  const rawKey = generateRawKey();
  const prefix = keyToPrefix(rawKey);
  const keyHash = await hashKey(rawKey);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("upload_keys")
    .insert({
      user_id: user.id,
      name,
      key_prefix: prefix,
      key_hash: keyHash,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    key: {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      key_prefix: data.key_prefix,
      raw_key: rawKey,
      created_at: data.created_at,
      last_used_at: null,
      revoked_at: null,
      active: true,
    },
    rawKey,
  };
}

export async function revokeUploadKey(id: string): Promise<void> {
  const { error } = await supabase
    .from("upload_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
