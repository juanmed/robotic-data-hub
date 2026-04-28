/**
 * marketplace-dataset-urls
 *
 * Generates signed read URLs for files in datasets that have published listings.
 * Any authenticated user (or anon) can call this for published datasets.
 *
 * POST /functions/v1/marketplace-dataset-urls
 * Body: { dataset_id: string, paths: string[] }
 *
 * Returns: { urls: { relative_path, signed_url, content_type }[] }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createEdgeLogger, serializeError } from "../_shared/logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export async function handler(req: Request): Promise<Response> {
  const log = createEdgeLogger("marketplace-dataset-urls", req, corsHeaders);

  if (req.method === "OPTIONS") {
    return log.complete(new Response(null, { headers: { ...corsHeaders, "x-request-id": log.requestId } }));
  }

  log.info("request_start");

  if (req.method !== "POST") {
    log.warn("method_not_allowed");
    return log.complete(log.jsonError("Method not allowed", 405));
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // --- 1. Parse body ---
    let body: { dataset_id?: string; paths?: string[] };
    try {
      body = await req.json();
    } catch {
      log.warn("malformed_json_body");
      return log.complete(log.jsonError("Malformed JSON body", 400));
    }

    if (!body.dataset_id || typeof body.dataset_id !== "string") {
      log.warn("invalid_dataset_id");
      return log.complete(log.jsonError("Missing or invalid 'dataset_id'", 400));
    }

    if (!Array.isArray(body.paths) || body.paths.length === 0) {
      log.warn("missing_or_empty_paths", { dataset_id: body.dataset_id });
      return log.complete(log.jsonError("Missing or empty 'paths' array", 400));
    }

    if (body.paths.length > 10) {
      log.warn("too_many_paths_requested", {
        dataset_id: body.dataset_id,
        requested_path_count: body.paths.length,
      });
      return log.complete(log.jsonError("Too many paths requested (max 10)", 400));
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // --- 2. Verify dataset has a published listing ---
    const { data: listing, error: listingError } = await adminClient
      .from("listings")
      .select("id")
      .eq("dataset_id", body.dataset_id)
      .eq("published", true)
      .maybeSingle();

    if (listingError) {
      log.error("listing_lookup_error", {
        dataset_id: body.dataset_id,
        db_error: listingError.message,
      });
      return log.complete(log.jsonError("Internal error", 500));
    }
    if (!listing) {
      log.warn("dataset_not_published", { dataset_id: body.dataset_id });
      return log.complete(log.jsonError("No published listing for this dataset", 403));
    }

    // --- 3. Fetch file records ---
    const { data: files, error: filesError } = await adminClient
      .from("dataset_files")
      .select("relative_path, storage_path, content_type")
      .eq("dataset_id", body.dataset_id)
      .eq("upload_status", "uploaded")
      .in("relative_path", body.paths);

    if (filesError) {
      log.error("files_lookup_error", {
        dataset_id: body.dataset_id,
        db_error: filesError.message,
      });
      return log.complete(log.jsonError("Internal error fetching files", 500));
    }

    if (!files || files.length === 0) {
      log.info("no_files_found", {
        dataset_id: body.dataset_id,
        requested_path_count: body.paths.length,
      });
      return log.complete(log.jsonOk({ urls: [] }));
    }

    // --- 4. Generate signed read URLs (valid 1 hour) ---
    const storagePaths = files.map((f: any) => f.storage_path);
    const { data: signedData, error: signedError } = await adminClient.storage
      .from("datasets")
      .createSignedUrls(storagePaths, 3600);

    if (signedError) {
      log.error("signed_url_error", {
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
      dataset_id: body.dataset_id,
      requested_path_count: body.paths.length,
      returned_url_count: urls.length,
    });
    return log.complete(log.jsonOk({ urls }));
  } catch (error) {
    log.error("request_failed", { ...serializeError(error) });
    return log.complete(log.jsonError("Internal server error", 500));
  }
}
