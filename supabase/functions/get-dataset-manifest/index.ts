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

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleManifest(datasetId: string, jwt: string) {
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
    return jsonError("Invalid or expired token", 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Fetch dataset and resolve access rules
  const { data: dataset, error: dsError } = await adminClient
    .from("datasets")
    .select("id, user_id")
    .eq("id", datasetId)
    .maybeSingle();

  if (dsError) {
    console.error("Dataset lookup error:", dsError);
    return jsonError("Internal error", 500);
  }
  if (!dataset) {
    return jsonError("Dataset not found", 404);
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
      console.error("Submission access (submitter) error:", submitterError);
      return jsonError("Internal error", 500);
    }

    let isChallengeOwner = false;
    const { data: ownerChallengeRows, error: ownerChallengeError } = await adminClient
      .from("challenge_submissions")
      .select("challenge_id")
      .eq("dataset_id", datasetId);
    if (ownerChallengeError) {
      console.error("Submission access (challenge rows) error:", ownerChallengeError);
      return jsonError("Internal error", 500);
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
        console.error("Submission access (challenge owner) error:", ownerError);
        return jsonError("Internal error", 500);
      }
      isChallengeOwner = !!ownerChallenge;
    }

    if (!submitterSubmission && !isChallengeOwner) {
      return jsonError("Access denied", 403);
    }
  }

  // Fetch uploaded files
  const { data: files, error: filesError } = await adminClient
    .from("dataset_files")
    .select("relative_path, storage_path")
    .eq("dataset_id", datasetId)
    .eq("upload_status", "uploaded")
    .order("relative_path");

  if (filesError) {
    console.error("Files lookup error:", filesError);
    return jsonError("Internal error fetching files", 500);
  }

  if (!files || files.length === 0) {
    return jsonError("Dataset contains no files", 404);
  }

  // Generate signed URLs (batch)
  const storagePaths = files.map((f) => f.storage_path);
  const { data: signedData, error: signedError } = await adminClient.storage
    .from("datasets")
    .createSignedUrls(storagePaths, 3600);

  if (signedError) {
    console.error("Signed URL error:", signedError);
    return jsonError("Failed to generate signed URLs", 500);
  }

  const manifest = {
    dataset_id: datasetId,
    files: files.map((f, i) => ({
      relative_path: f.relative_path,
      signed_url: signedData?.[i]?.signedUrl ?? null,
    })),
  };

  return jsonOk(manifest);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonError("Missing authorization", 401);
  }
  const jwt = authHeader.replace("Bearer ", "").trim();

  let datasetId: string | null = null;

  if (req.method === "POST") {
    try {
      const body = await req.json();
      datasetId = body.dataset_id ?? null;
    } catch {
      return jsonError("Malformed JSON body", 400);
    }
  } else if (req.method === "GET") {
    // Support ?dataset_id=... query param (used when Cloudflare proxies GET /datasets/{id})
    const url = new URL(req.url);
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
    return jsonError("Method not allowed", 405);
  }

  if (!datasetId || typeof datasetId !== "string") {
    return jsonError("Missing or invalid 'dataset_id'", 400);
  }

  return handleManifest(datasetId, jwt);
});
