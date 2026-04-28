/**
 * finalize-dataset-upload
 *
 * Finalizes a dataset upload. Only requires { dataset_id }.
 * Verifies all files exist in storage, marks them as uploaded, sets dataset to 'ready'.
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
  const log = createEdgeLogger("finalize-dataset-upload", req, corsHeaders);

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

    // --- 2. Parse body ---
    let body: { dataset_id?: string };
    try {
      body = await req.json();
    } catch {
      log.warn("malformed_json_body", { user_id: userId });
      return log.complete(log.jsonError("Malformed JSON body", 400));
    }

    if (!body.dataset_id || typeof body.dataset_id !== "string") {
      log.warn("invalid_dataset_id", { user_id: userId });
      return log.complete(log.jsonError("Missing or invalid 'dataset_id'", 400));
    }

    // --- 3. Verify dataset ownership ---
    const { data: dataset, error: dsError } = await supabase
      .from("datasets")
      .select("id, user_id, status")
      .eq("id", body.dataset_id)
      .maybeSingle();

    if (dsError) {
      log.error("dataset_lookup_error", {
        user_id: userId,
        dataset_id: body.dataset_id,
        db_error: dsError.message,
      });
      return log.complete(log.jsonError("Internal error loading dataset", 500));
    }
    if (!dataset) {
      log.warn("dataset_not_found", { user_id: userId, dataset_id: body.dataset_id });
      return log.complete(log.jsonError("Dataset not found", 404));
    }
    if (dataset.user_id !== userId) {
      log.warn("dataset_access_denied", {
        user_id: userId,
        dataset_id: body.dataset_id,
        dataset_owner_id: dataset.user_id,
      });
      return log.complete(log.jsonError("Access denied", 403));
    }

    // --- 4. Load all pending files and verify in storage ---
    const { data: allFiles, error: filesError } = await supabase
      .from("dataset_files")
      .select("id, relative_path, storage_path, upload_status")
      .eq("dataset_id", body.dataset_id);

    if (filesError) {
      log.error("files_lookup_error", {
        user_id: userId,
        dataset_id: body.dataset_id,
        db_error: filesError.message,
      });
      return log.complete(log.jsonError("Internal error loading files", 500));
    }

    const pendingFiles = (allFiles ?? []).filter((f: any) => f.upload_status !== "uploaded");
    const missingFiles: string[] = [];

    // Verify each pending file exists in storage
    for (const f of pendingFiles) {
      const pathParts = f.storage_path.split("/");
      const fileName = pathParts.pop()!;
      const folder = pathParts.join("/");

      const { data: listed, error: listError } = await supabase.storage
        .from("datasets")
        .list(folder, { limit: 1, search: fileName });

      if (listError) {
        log.error("storage_list_error", {
          user_id: userId,
          dataset_id: body.dataset_id,
          storage_path: f.storage_path,
          storage_error: listError.message,
        });
        return log.complete(log.jsonError("Internal error verifying uploaded files", 500));
      }

      if (listed && listed.length > 0) {
        const { error: updateError } = await supabase
          .from("dataset_files")
          .update({ upload_status: "uploaded" })
          .eq("id", f.id);
        if (updateError) {
          log.error("file_status_update_error", {
            user_id: userId,
            dataset_id: body.dataset_id,
            file_id: f.id,
            db_error: updateError.message,
          });
          return log.complete(log.jsonError("Internal error finalizing file state", 500));
        }
      } else {
        missingFiles.push(f.relative_path);
      }
    }

    // --- 5. Determine final status ---
    const totalCount = allFiles?.length ?? 0;
    const uploadedCount = totalCount - missingFiles.length;
    const allUploaded = totalCount > 0 && missingFiles.length === 0;
    const newStatus = allUploaded ? "ready" : "uploading";
    const updatePayload: Record<string, string> = { status: newStatus };
    if (allUploaded) updatePayload.confirmed_at = new Date().toISOString();

    const { error: datasetUpdateError } = await supabase
      .from("datasets")
      .update(updatePayload)
      .eq("id", body.dataset_id);
    if (datasetUpdateError) {
      log.error("dataset_status_update_error", {
        user_id: userId,
        dataset_id: body.dataset_id,
        db_error: datasetUpdateError.message,
      });
      return log.complete(log.jsonError("Internal error updating dataset status", 500));
    }

    // --- 6. Update last_used_at ---
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

    log.info("dataset_finalized", {
      user_id: userId,
      dataset_id: body.dataset_id,
      status: newStatus,
      uploaded_count: uploadedCount,
      total_count: totalCount,
      missing_count: missingFiles.length,
    });

    return log.complete(log.jsonOk({
      dataset_id: body.dataset_id,
      status: newStatus,
      uploaded_count: uploadedCount,
      total_count: totalCount,
      ...(missingFiles.length > 0 ? { missing_files: missingFiles } : {}),
    }));
  } catch (error) {
    log.error("request_failed", { ...serializeError(error) });
    return log.complete(log.jsonError("Internal server error", 500));
  }
}
