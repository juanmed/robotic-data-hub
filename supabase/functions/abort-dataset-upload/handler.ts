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
  const log = createEdgeLogger("abort-dataset-upload", req, corsHeaders);

  if (req.method === "OPTIONS") {
    return log.complete(new Response(null, { headers: { ...corsHeaders, "x-request-id": log.requestId } }));
  }

  log.info("request_start");

  if (req.method !== "POST") {
    log.warn("method_not_allowed");
    return log.complete(log.jsonError("Method not allowed", 405));
  }

  try {
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

    let body: { dataset_id?: unknown };
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

    const { data: dataset, error: dsError } = await supabase
      .from("datasets")
      .select("id, user_id")
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

    const { data: files, error: filesLookupError } = await supabase
      .from("dataset_files")
      .select("storage_path")
      .eq("dataset_id", body.dataset_id);
    if (filesLookupError) {
      log.error("files_lookup_error", {
        user_id: userId,
        dataset_id: body.dataset_id,
        db_error: filesLookupError.message,
      });
      return log.complete(log.jsonError("Internal error loading file paths", 500));
    }

    let storageDeleteErrors = 0;
    if (files && files.length > 0) {
      const storagePaths = files.map((f: any) => f.storage_path);
      const { error: removeError } = await supabase.storage
        .from("datasets")
        .remove(storagePaths);

      if (removeError) {
        storageDeleteErrors = 1;
        log.error("storage_cleanup_error", {
          user_id: userId,
          dataset_id: body.dataset_id,
          storage_error: removeError.message,
          file_count: storagePaths.length,
        });
      }
    }

    const { error: deleteFilesError } = await supabase
      .from("dataset_files")
      .delete()
      .eq("dataset_id", body.dataset_id);
    if (deleteFilesError) {
      log.error("file_records_delete_error", {
        user_id: userId,
        dataset_id: body.dataset_id,
        db_error: deleteFilesError.message,
      });
      return log.complete(log.jsonError("Failed to delete dataset file records", 500));
    }

    const { error: deleteDatasetError } = await supabase
      .from("datasets")
      .delete()
      .eq("id", body.dataset_id);
    if (deleteDatasetError) {
      log.error("dataset_delete_error", {
        user_id: userId,
        dataset_id: body.dataset_id,
        db_error: deleteDatasetError.message,
      });
      return log.complete(log.jsonError("Failed to delete dataset", 500));
    }

    log.info("dataset_aborted", {
      user_id: userId,
      dataset_id: body.dataset_id,
      storage_delete_errors: storageDeleteErrors,
    });
    return log.complete(log.jsonOk({ dataset_id: body.dataset_id, status: "aborted" }));
  } catch (error) {
    log.error("request_failed", { ...serializeError(error) });
    return log.complete(log.jsonError("Internal server error", 500));
  }
}
