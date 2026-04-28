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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function logInfo(requestId: string, message: string, extra: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      request_id: requestId,
      message,
      ...extra,
    }),
  );
}

function logError(requestId: string, message: string, extra: Record<string, unknown> = {}) {
  console.error(
    JSON.stringify({
      request_id: requestId,
      message,
      ...extra,
    }),
  );
}

function jsonError(
  message: string,
  status: number,
  requestId?: string,
  extra: Record<string, unknown> = {},
) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
  });
}

function jsonOk(body: unknown, requestId?: string) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
  });
}

async function handleManifest(datasetId: string, jwt: string, requestId: string) {
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
    logInfo(requestId, "auth_user_failed", { user_error: userError?.message ?? null });
    return jsonError("Invalid or expired token", 401, requestId);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  logInfo(requestId, "auth_user_ok", { user_id: user.id, dataset_id: datasetId });

  // Fetch dataset and resolve access rules
  const { data: dataset, error: dsError } = await adminClient
    .from("datasets")
    .select("id, user_id")
    .eq("id", datasetId)
    .maybeSingle();

  if (dsError) {
    logError(requestId, "dataset_lookup_error", { error: dsError.message });
    return jsonError("Internal error", 500, requestId);
  }
  if (!dataset) {
    logInfo(requestId, "dataset_not_found", { dataset_id: datasetId });
    return jsonError("Dataset not found", 404, requestId);
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
      logError(requestId, "submitter_access_lookup_error", { error: submitterError.message });
      return jsonError("Internal error", 500, requestId);
    }

    let isChallengeOwner = false;
    const { data: ownerChallengeRows, error: ownerChallengeError } = await adminClient
      .from("challenge_submissions")
      .select("challenge_id")
      .eq("dataset_id", datasetId);
    if (ownerChallengeError) {
      logError(requestId, "challenge_rows_lookup_error", { error: ownerChallengeError.message });
      return jsonError("Internal error", 500, requestId);
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
        logError(requestId, "challenge_owner_lookup_error", { error: ownerError.message });
        return jsonError("Internal error", 500, requestId);
      }
      isChallengeOwner = !!ownerChallenge;
    }

    if (!submitterSubmission && !isChallengeOwner) {
      logInfo(requestId, "access_denied", {
        user_id: user.id,
        dataset_id: datasetId,
        dataset_owner_id: dataset.user_id,
        has_submitter_submission: !!submitterSubmission,
        challenge_ids_count: challengeIds.length,
        is_challenge_owner: isChallengeOwner,
      });
      return jsonError("Access denied", 403, requestId, {
        reason: "not_dataset_owner_submitter_or_challenge_owner",
      });
    }

    logInfo(requestId, "access_granted_via_submission_path", {
      user_id: user.id,
      dataset_id: datasetId,
      has_submitter_submission: !!submitterSubmission,
      is_challenge_owner: isChallengeOwner,
    });
  } else {
    logInfo(requestId, "access_granted_dataset_owner", {
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
    logError(requestId, "files_lookup_error", { error: filesError.message });
    return jsonError("Internal error fetching files", 500, requestId);
  }

  if (!files || files.length === 0) {
    logInfo(requestId, "files_empty", { dataset_id: datasetId });
    return jsonError("Dataset contains no files", 404, requestId);
  }

  // Generate signed URLs (batch)
  const storagePaths = files.map((f) => f.storage_path);
  const { data: signedData, error: signedError } = await adminClient.storage
    .from("datasets")
    .createSignedUrls(storagePaths, 3600);

  if (signedError) {
    logError(requestId, "signed_url_error", { error: signedError.message });
    return jsonError("Failed to generate signed URLs", 500, requestId);
  }

  const manifest = {
    dataset_id: datasetId,
    files: files.map((f, i) => ({
      relative_path: f.relative_path,
      signed_url: signedData?.[i]?.signedUrl ?? null,
    })),
  };

  logInfo(requestId, "manifest_ok", { dataset_id: datasetId, file_count: files.length });
  return jsonOk(manifest, requestId);
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    logInfo(requestId, "preflight");
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  logInfo(requestId, "request_start", { method: req.method, pathname: url.pathname });

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    logInfo(requestId, "missing_authorization");
    return jsonError("Missing authorization", 401, requestId);
  }
  const jwt = authHeader.replace("Bearer ", "").trim();

  let datasetId: string | null = null;

  if (req.method === "POST") {
    try {
      const body = await req.json();
      datasetId = body.dataset_id ?? null;
    } catch {
      logInfo(requestId, "malformed_json_body");
      return jsonError("Malformed JSON body", 400, requestId);
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
    logInfo(requestId, "method_not_allowed", { method: req.method });
    return jsonError("Method not allowed", 405, requestId);
  }

  if (!datasetId || typeof datasetId !== "string") {
    logInfo(requestId, "dataset_id_missing_or_invalid");
    return jsonError("Missing or invalid 'dataset_id'", 400, requestId);
  }

  return handleManifest(datasetId, jwt, requestId);
});
