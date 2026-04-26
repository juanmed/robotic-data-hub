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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  // --- 1. Validate JWT from Authorization header ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonError("Missing authorization", 401);
  }
  const jwt = authHeader.replace("Bearer ", "").trim();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Create a client with the user's JWT to verify identity
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

  // --- 2. Parse body ---
  let body: { dataset_id?: string; paths?: string[] };
  try {
    body = await req.json();
  } catch {
    return jsonError("Malformed JSON body", 400);
  }

  if (!body.dataset_id || typeof body.dataset_id !== "string") {
    return jsonError("Missing or invalid 'dataset_id'", 400);
  }

  // --- 3. Verify dataset access ---
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: dataset, error: dsError } = await adminClient
    .from("datasets")
    .select("id, user_id")
    .eq("id", body.dataset_id)
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
      .eq("dataset_id", body.dataset_id)
      .eq("submitter_id", user.id)
      .limit(1)
      .maybeSingle();
    if (submitterError) {
      console.error("Submission access (submitter) error:", submitterError);
      return jsonError("Internal error", 500);
    }

    const { data: acceptedRows, error: acceptedRowsError } = await adminClient
      .from("challenge_submissions")
      .select("challenge_id")
      .eq("dataset_id", body.dataset_id)
      .eq("status", "accepted");
    if (acceptedRowsError) {
      console.error("Submission access (accepted rows) error:", acceptedRowsError);
      return jsonError("Internal error", 500);
    }

    let isAcceptedChallengeOwner = false;
    const acceptedChallengeIds = [...new Set((acceptedRows ?? []).map((r) => r.challenge_id))];
    if (acceptedChallengeIds.length > 0) {
      const { data: ownerChallenge, error: ownerError } = await adminClient
        .from("challenges")
        .select("id")
        .eq("user_id", user.id)
        .in("id", acceptedChallengeIds)
        .limit(1)
        .maybeSingle();
      if (ownerError) {
        console.error("Submission access (challenge owner) error:", ownerError);
        return jsonError("Internal error", 500);
      }
      isAcceptedChallengeOwner = !!ownerChallenge;
    }

    if (!submitterSubmission && !isAcceptedChallengeOwner) {
      return jsonError("Access denied", 403);
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
    console.error("Files lookup error:", filesError);
    return jsonError("Internal error fetching files", 500);
  }

  if (!files || files.length === 0) {
    return new Response(JSON.stringify({ urls: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- 5. Generate signed read URLs (valid 1 hour) ---
  const storagePaths = files.map((f) => f.storage_path);
  const { data: signedData, error: signedError } = await adminClient.storage
    .from("datasets")
    .createSignedUrls(storagePaths, 3600);

  if (signedError) {
    console.error("Signed URL error:", signedError);
    return jsonError("Failed to generate signed URLs", 500);
  }

  const urls = files.map((f, i) => ({
    relative_path: f.relative_path,
    signed_url: signedData?.[i]?.signedUrl ?? null,
    content_type: f.content_type,
  }));

  return new Response(JSON.stringify({ urls }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
