import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger, serializeError } from "../_shared/logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function handler(req: Request): Promise<Response> {
  const log = createEdgeLogger("generate-api-key", req, corsHeaders);

  if (req.method === "OPTIONS") {
    return log.complete(new Response("ok", { headers: { ...corsHeaders, "x-request-id": log.requestId } }));
  }

  log.info("request_start");

  if (req.method !== "POST") {
    log.warn("method_not_allowed");
    return log.complete(log.jsonError("Method not allowed", 405));
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log.warn("missing_authorization_header");
      return log.complete(log.jsonError("Missing auth", 401));
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      log.warn("unauthorized_user", {
        user_error: userError?.message ?? null,
      });
      return log.complete(log.jsonError("Unauthorized", 401));
    }

    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      log.warn("invalid_name_payload", { user_id: user.id });
      return log.complete(log.jsonError("Name is required", 400));
    }

    // Generate a random key
    const rawBytes = new Uint8Array(24);
    crypto.getRandomValues(rawBytes);
    const rawKey = "gpai_" + Array.from(rawBytes).map(b => b.toString(16).padStart(2, "0")).join("");

    // Hash the key for storage
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await adminClient
      .from("api_keys")
      .insert({ user_id: user.id, name, key_hash: keyHash, key_prefix: rawKey.slice(0, 12) })
      .select("id, name, key_prefix, created_at")
      .single();

    if (error) {
      log.error("api_key_insert_failed", {
        user_id: user.id,
        db_error: error.message,
      });
      return log.complete(log.jsonError(error.message, 500));
    }

    log.info("api_key_created", {
      user_id: user.id,
      api_key_id: data.id,
    });
    return log.complete(log.jsonOk({ ...data, raw_key: rawKey }));
  } catch (e) {
    log.error("request_failed", { ...serializeError(e) });
    return log.complete(log.jsonError("Internal server error", 500));
  }
}
