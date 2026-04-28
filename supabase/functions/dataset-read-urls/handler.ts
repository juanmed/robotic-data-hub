/**
 * dataset-read-urls
 *
 * Generates signed read URLs for files in a private dataset storage bucket.
 * Authenticated via the user's Supabase JWT (standard auth, not upload keys).
 *
 * POST /functions/v1/dataset-read-urls
 * Body: { dataset_id: string, paths?: string[] }
 *   - If paths is omitted, returns signed URLs for ALL files in the dataset.
 *   - If paths is provided, returns signed URLs only for those relative_paths.
 *
 * Returns: { urls: { relative_path, signed_url, content_type }[] }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { resolveDatasetAccess } from "../_shared/dataset_access.ts";
import { createEdgeLogger, serializeError } from "../_shared/logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export async function handler(req: Request): Promise<Response> {
  const log = createEdgeLogger("dataset-read-urls", req, corsHeaders);

  if (req.method === "OPTIONS") {
    return log.complete(new Response(null, { headers: { ...corsHeaders, "x-request-id": log.requestId } }));
  }

  log.info("request_start");

  if (req.method !== "POST") {
    log.warn("method_not_allowed");
    return log.complete(log.jsonError("Method not allowed", 405));
  }

  try {
    // --- 1. Validate JWT from Authorization header ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      log.warn("missing_authorization");
      return log.complete(log.jsonError("Missing authorization", 401));
    }
    const jwt = authHeader.replace("Bearer ", "").trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      log.warn("auth_user_failed", { user_error: userError?.message ?? null });
      return log.complete(log.jsonError("Invalid or expired token", 401));
    }

    // --- 2. Parse body ---
    let body: { dataset_id?: string; paths?: string[] };
    try {
      body = await req.json();
    } catch {
      log.warn("malformed_json_body", { user_id: user.id });
      return log.complete(log.jsonError("Malformed JSON body", 400));
    }

    if (!body.dataset_id || typeof body.dataset_id !== "string") {
      log.warn("invalid_dataset_id", { user_id: user.id });
      return log.complete(log.jsonError("Missing or invalid 'dataset_id'", 400));
    }

    // --- 3. Verify dataset access ---
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: dataset, error: dsError } = await adminClient
      .from("datasets")
      .select("id, user_id")
      .eq("id", body.dataset_id)
      .maybeSingle();

    if (dsError) {
      log.error("dataset_lookup_error", {
        user_id: user.id,
        dataset_id: body.dataset_id,
        db_error: dsError.message,
      });
      return log.complete(log.jsonError("Internal error", 500));
    }
    if (!dataset) {
      log.warn("dataset_not_found", { user_id: user.id, dataset_id: body.dataset_id });
      return log.complete(log.jsonError("Dataset not found", 404));
    }

    const { data: access, error: accessError } = await resolveDatasetAccess({
      supabaseUrl,
      serviceRoleKey,
      datasetId: body.dataset_id,
      userId: user.id,
      datasetOwnerId: dataset.user_id,
    });

    if (accessError) {
      log.error("dataset_access_lookup_error", {
        user_id: user.id,
        dataset_id: body.dataset_id,
        db_error: accessError.message,
      });
      return log.complete(log.jsonError("Internal error", 500));
    }

    if (!access?.isDatasetOwner) {
      if (!access?.isSubmitter && !access?.isAcceptedChallengeOwner) {
        log.warn("dataset_access_denied", {
          user_id: user.id,
          dataset_id: body.dataset_id,
          dataset_owner_id: dataset.user_id,
          has_submitter_submission: !!access?.isSubmitter,
          is_accepted_challenge_owner: !!access?.isAcceptedChallengeOwner,
        });
        return log.complete(log.jsonError("Access denied", 403));
      }
    }

    // --- 4. Fetch file records ---
    let query = adminClient
      .from("dataset_files")
      .select("relative_path, storage_path, content_type")
      .eq("dataset_id", body.dataset_id)
      .eq("upload_status", "uploaded");

    if (Array.isArray(body.paths) && body.paths.length > 0) {
      query = query.in("relative_path", body.paths);
    }

    const { data: files, error: filesError } = await query;

    if (filesError) {
      log.error("files_lookup_error", {
        user_id: user.id,
        dataset_id: body.dataset_id,
        db_error: filesError.message,
      });
      return log.complete(log.jsonError("Internal error fetching files", 500));
    }

    if (!files || files.length === 0) {
      log.info("no_files_found", {
        user_id: user.id,
        dataset_id: body.dataset_id,
      });
      return log.complete(log.jsonOk({ urls: [] }));
    }

    // --- 5. Generate signed read URLs (valid 1 hour) ---
    const storagePaths = files.map((f: any) => f.storage_path);
    const { data: signedData, error: signedError } = await adminClient.storage
      .from("datasets")
      .createSignedUrls(storagePaths, 3600);

    if (signedError) {
      log.error("signed_url_error", {
        user_id: user.id,
        dataset_id: body.dataset_id,
        storage_error: signedError.message,
      });
      return log.complete(log.jsonError("Failed to generate signed URLs", 500));
    }

    const urls = files.map((f: any, i: number) => ({
      relative_path: f.relative_path,
      signed_url: signedData?.[i]?.signedUrl ?? null,
      content_type: f.content_type,
    }));

    log.info("signed_urls_generated", {
      user_id: user.id,
      dataset_id: body.dataset_id,
      returned_url_count: urls.length,
      requested_path_count: Array.isArray(body.paths) ? body.paths.length : null,
    });
    return log.complete(log.jsonOk({ urls }));
  } catch (error) {
    log.error("request_failed", { ...serializeError(error) });
    return log.complete(log.jsonError("Internal server error", 500));
  }
}
