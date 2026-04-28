/**
 * get-dataset-manifest
 *
 * Returns a dataset manifest with signed URLs for all files.
 *
 * Supports:
 *   POST /functions/v1/get-dataset-manifest  { dataset_id: "uuid" }
 *   GET  /functions/v1/get-dataset-manifest?dataset_id=uuid
 *
 * The Cloudflare proxy at api.gamiphy.ai rewrites:
 *   GET /datasets/{dataset_id} → this function
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createEdgeLogger, serializeError } from "../_shared/logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function handleManifest(
  datasetId: string,
  jwt: string,
  log: ReturnType<typeof createEdgeLogger>,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Verify user identity
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    log.warn("auth_user_failed", { user_error: userError?.message ?? null });
    return log.jsonError("Invalid or expired token", 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  log.info("auth_user_ok", { user_id: user.id, dataset_id: datasetId });

  // Fetch dataset and resolve access rules
  const { data: dataset, error: dsError } = await adminClient
    .from("datasets")
    .select("id, user_id")
    .eq("id", datasetId)
    .maybeSingle();

  if (dsError) {
    log.error("dataset_lookup_error", { db_error: dsError.message });
    return log.jsonError("Internal error", 500);
  }
  if (!dataset) {
    log.warn("dataset_not_found", { dataset_id: datasetId });
    return log.jsonError("Dataset not found", 404);
  }

  const isDatasetOwner = dataset.user_id === user.id;
  if (!isDatasetOwner) {
    const { data: submitterSubmission, error: submitterError } = await adminClient
      .from("challenge_submissions")
      .select("id")
      .eq("dataset_id", datasetId)
      .eq("submitter_id", user.id)
      .limit(1)
      .maybeSingle();
    if (submitterError) {
      log.error("submitter_access_lookup_error", { db_error: submitterError.message });
      return log.jsonError("Internal error", 500);
    }

    let isChallengeOwner = false;
    const { data: ownerChallengeRows, error: ownerChallengeError } = await adminClient
      .from("challenge_submissions")
      .select("challenge_id")
      .eq("dataset_id", datasetId);
    if (ownerChallengeError) {
      log.error("challenge_rows_lookup_error", { db_error: ownerChallengeError.message });
      return log.jsonError("Internal error", 500);
    }

    const challengeIds = [...new Set((ownerChallengeRows ?? []).map((r) => r.challenge_id))];
    if (challengeIds.length > 0) {
      const { data: ownerChallenge, error: ownerError } = await adminClient
        .from("challenges")
        .select("id")
        .eq("user_id", user.id)
        .in("id", challengeIds)
        .limit(1)
        .maybeSingle();
      if (ownerError) {
        log.error("challenge_owner_lookup_error", { db_error: ownerError.message });
        return log.jsonError("Internal error", 500);
      }
      isChallengeOwner = !!ownerChallenge;
    }

    if (!submitterSubmission && !isChallengeOwner) {
      log.warn("access_denied", {
        user_id: user.id,
        dataset_id: datasetId,
        dataset_owner_id: dataset.user_id,
        has_submitter_submission: !!submitterSubmission,
        challenge_ids_count: challengeIds.length,
        is_challenge_owner: isChallengeOwner,
      });
      return log.jsonError("Access denied", 403, {
        reason: "not_dataset_owner_submitter_or_challenge_owner",
      });
    }

    log.info("access_granted_via_submission_path", {
      user_id: user.id,
      dataset_id: datasetId,
      has_submitter_submission: !!submitterSubmission,
      is_challenge_owner: isChallengeOwner,
    });
  } else {
    log.info("access_granted_dataset_owner", {
      user_id: user.id,
      dataset_id: datasetId,
    });
  }

  // Fetch uploaded files
  const { data: files, error: filesError } = await adminClient
    .from("dataset_files")
    .select("relative_path, storage_path")
    .eq("dataset_id", datasetId)
    .eq("upload_status", "uploaded")
    .order("relative_path");

  if (filesError) {
    log.error("files_lookup_error", { db_error: filesError.message });
    return log.jsonError("Internal error fetching files", 500);
  }

  if (!files || files.length === 0) {
    log.warn("files_empty", { dataset_id: datasetId });
    return log.jsonError("Dataset contains no files", 404);
  }

  // Generate signed URLs (batch)
  const storagePaths = files.map((f) => f.storage_path);
  const { data: signedData, error: signedError } = await adminClient.storage
    .from("datasets")
    .createSignedUrls(storagePaths, 3600);

  if (signedError) {
    log.error("signed_url_error", { storage_error: signedError.message });
    return log.jsonError("Failed to generate signed URLs", 500);
  }

  const manifest = {
    dataset_id: datasetId,
    files: files.map((f, i) => ({
      relative_path: f.relative_path,
      signed_url: signedData?.[i]?.signedUrl ?? null,
    })),
  };

  log.info("manifest_ok", { dataset_id: datasetId, file_count: files.length });
  return log.jsonOk(manifest);
}

Deno.serve(async (req) => {
  const log = createEdgeLogger("get-dataset-manifest", req, corsHeaders);

  if (req.method === "OPTIONS") {
    return log.complete(new Response(null, { headers: { ...corsHeaders, "x-request-id": log.requestId } }));
  }

  log.info("request_start");

  const url = log.url;

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    log.warn("missing_authorization");
    return log.complete(log.jsonError("Missing authorization", 401));
  }
  const jwt = authHeader.replace("Bearer ", "").trim();

  let datasetId: string | null = null;

  if (req.method === "POST") {
    try {
      const body = await req.json();
      datasetId = body.dataset_id ?? null;
    } catch {
      log.warn("malformed_json_body");
      return log.complete(log.jsonError("Malformed JSON body", 400));
    }
  } else if (req.method === "GET") {
    // Support ?dataset_id=... query param (used when Cloudflare proxies GET /datasets/{id})
    datasetId = url.searchParams.get("dataset_id");

    // Also support path-based: /get-dataset-manifest/{dataset_id}
    if (!datasetId) {
      const pathParts = url.pathname.split("/").filter(Boolean);
      const last = pathParts[pathParts.length - 1];
      if (last && last !== "get-dataset-manifest") {
        datasetId = last;
      }
    }
  } else {
    log.warn("method_not_allowed", { method: req.method });
    return log.complete(log.jsonError("Method not allowed", 405));
  }

  if (!datasetId || typeof datasetId !== "string") {
    log.warn("dataset_id_missing_or_invalid");
    return log.complete(log.jsonError("Missing or invalid 'dataset_id'", 400));
  }

  try {
    const response = await handleManifest(datasetId, jwt, log);
    return log.complete(response);
  } catch (error) {
    log.error("request_failed", {
      dataset_id: datasetId,
      ...serializeError(error),
    });
    return log.complete(log.jsonError("Internal server error", 500));
  }
});
