/**
 * init-dataset-upload
 *
 * Initializes a dataset upload session for CLI-based ingestion (LeRobot compatible).
 *
 * Authentication: Authorization: Bearer <upload_key>
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createEdgeLogger, serializeError } from "../_shared/logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function handler(req: Request): Promise<Response> {
  const log = createEdgeLogger("init-dataset-upload", req, corsHeaders);

  if (req.method === "OPTIONS") {
    return log.complete(new Response(null, { headers: { ...corsHeaders, "x-request-id": log.requestId } }));
  }

  log.info("request_start");

  if (req.method !== "POST") {
    log.warn("method_not_allowed");
    return log.complete(log.jsonError("Method not allowed", 405));
  }

  try {
    // --- 1. Validate upload key ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      log.warn("missing_or_malformed_authorization_header");
      return log.complete(log.jsonError("Missing or malformed Authorization header", 401));
    }
    const rawKey = authHeader.replace("Bearer ", "").trim();
    if (!rawKey || !rawKey.startsWith("gpai_upl_")) {
      log.warn("invalid_upload_key_format");
      return log.complete(log.jsonError("Invalid upload key format", 401));
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const keyHash = await sha256(rawKey);
    const { data: keyRow, error: keyError } = await supabase
      .from("upload_keys")
      .select("id, user_id, revoked_at")
      .eq("key_hash", keyHash)
      .maybeSingle();

    if (keyError) {
      log.error("key_lookup_error", { db_error: keyError.message });
      return log.complete(log.jsonError("Internal error validating key", 500));
    }
    if (!keyRow) {
      log.warn("invalid_upload_key");
      return log.complete(log.jsonError("Invalid upload key", 401));
    }
    if (keyRow.revoked_at) {
      log.warn("revoked_upload_key", { upload_key_id: keyRow.id });
      return log.complete(log.jsonError("This upload key has been revoked", 403));
    }

    const userId = keyRow.user_id;

    // --- 2. Parse request body (LeRobot shape) ---
    let body: {
      display_name?: string;
      source_repo_id?: string;
      metadata?: Record<string, unknown>;
      files?: Array<{
        path: string;
        size_bytes?: number;
        content_type?: string;
        checksum?: string;
      }>;
    };

    try {
      body = await req.json();
    } catch {
      log.warn("malformed_json_body", { user_id: userId });
      return log.complete(log.jsonError("Malformed JSON body", 400));
    }

    if (!body.display_name || typeof body.display_name !== "string") {
      log.warn("invalid_display_name", { user_id: userId });
      return log.complete(log.jsonError("Missing or invalid 'display_name'", 400));
    }
    if (!Array.isArray(body.files) || body.files.length === 0) {
      log.warn("invalid_files_array", { user_id: userId });
      return log.complete(log.jsonError("'files' must be a non-empty array", 400));
    }
    for (const f of body.files) {
      if (!f.path || typeof f.path !== "string") {
        log.warn("invalid_file_path_in_payload", { user_id: userId });
        return log.complete(log.jsonError("Each file must have a valid 'path'", 400));
      }
    }

    // --- 3. Create dataset record ---
    const { data: dataset, error: datasetError } = await supabase
      .from("datasets")
      .insert({
        user_id: userId,
        display_name: body.display_name,
        source_repo_id: body.source_repo_id || null,
        metadata: body.metadata || null,
        status: "uploading",
      })
      .select("id")
      .single();

    if (datasetError || !dataset) {
      log.error("dataset_creation_error", {
        user_id: userId,
        db_error: datasetError?.message ?? null,
      });
      return log.complete(log.jsonError("Failed to create dataset", 500));
    }

    const datasetId = dataset.id;

    // --- 4. Create file records + signed upload URLs ---
    const uploadInstructions: Record<string, { url: string; method: string; headers: Record<string, string> }> = {};

    for (const f of body.files) {
      const storagePath = `${userId}/${datasetId}/${f.path}`;

      const { error: fileError } = await supabase
        .from("dataset_files")
        .insert({
          dataset_id: datasetId,
          relative_path: f.path,
          storage_path: storagePath,
          content_type: f.content_type || null,
          size_bytes: f.size_bytes || null,
          upload_status: "pending",
        });

      if (fileError) {
        log.error("file_record_creation_error", {
          user_id: userId,
          dataset_id: datasetId,
          relative_path: f.path,
          db_error: fileError.message,
        });
        return log.complete(log.jsonError(`Failed to register file: ${f.path}`, 500));
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from("datasets")
        .createSignedUploadUrl(storagePath);

      if (signedError || !signedData) {
        log.error("signed_upload_url_error", {
          user_id: userId,
          dataset_id: datasetId,
          relative_path: f.path,
          storage_error: signedError?.message ?? null,
        });
        return log.complete(log.jsonError(`Failed to generate upload URL for: ${f.path}`, 500));
      }

      uploadInstructions[f.path] = {
        url: signedData.signedUrl,
        method: "PUT",
        headers: {},
      };
    }

    // --- 5. Update last_used_at ---
    const { error: keyTouchError } = await supabase
      .from("upload_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRow.id);
    if (keyTouchError) {
      log.warn("upload_key_last_used_update_failed", {
        upload_key_id: keyRow.id,
        db_error: keyTouchError.message,
      });
    }

    log.info("upload_session_created", {
      user_id: userId,
      dataset_id: datasetId,
      file_count: body.files.length,
    });

    // --- 6. Return LeRobot-compatible response ---
    return log.complete(log.jsonOk({
      dataset_id: datasetId,
      upload_instructions: uploadInstructions,
    }));
  } catch (error) {
    log.error("request_failed", { ...serializeError(error) });
    return log.complete(log.jsonError("Internal server error", 500));
  }
}
