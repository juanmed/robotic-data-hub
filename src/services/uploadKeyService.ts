import { supabase } from "@/integrations/supabase/client";
import type { UploadKey } from "@/types";

function generateRawKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "gai_upl_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function keyToPrefix(rawKey: string): string {
  return rawKey.slice(0, 12) + "****";
}

async function hashKey(raw: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function listUploadKeys(): Promise<UploadKey[]> {
  try {
    const { data, error } = await supabase
      .from("upload_keys" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("upload_keys table may not exist yet:", error.message);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      key_prefix: row.key_prefix,
      created_at: row.created_at,
      last_used_at: row.last_used_at ?? null,
      revoked_at: row.revoked_at ?? null,
      active: !row.revoked_at,
    }));
  } catch {
    return [];
  }
}

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
    .from("upload_keys" as any)
    .insert({
      user_id: user.id,
      name,
      key_prefix: prefix,
      key_hash: keyHash,
    } as any)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const row = data as any;
  return {
    key: {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      key_prefix: row.key_prefix,
      raw_key: rawKey,
      created_at: row.created_at,
      last_used_at: null,
      revoked_at: null,
      active: true,
    },
    rawKey,
  };
}

export async function revokeUploadKey(id: string): Promise<void> {
  const { error } = await supabase
    .from("upload_keys" as any)
    .update({ revoked_at: new Date().toISOString() } as any)
    .eq("id", id);

  if (error) throw new Error(error.message);
}
