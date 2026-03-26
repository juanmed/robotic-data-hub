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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // --- 1. Parse body ---
  let body: { dataset_id?: string; paths?: string[] };
  try {
    body = await req.json();
  } catch {
    return jsonError("Malformed JSON body", 400);
  }

  if (!body.dataset_id || typeof body.dataset_id !== "string") {
    return jsonError("Missing or invalid 'dataset_id'", 400);
  }

  if (!Array.isArray(body.paths) || body.paths.length === 0) {
    return jsonError("Missing or empty 'paths' array", 400);
  }

  // Limit paths to prevent abuse
  if (body.paths.length > 10) {
    return jsonError("Too many paths requested (max 10)", 400);
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
    console.error("Listing lookup error:", listingError);
    return jsonError("Internal error", 500);
  }
  if (!listing) {
    return jsonError("No published listing for this dataset", 403);
  }

  // --- 3. Fetch file records ---
  const { data: files, error: filesError } = await adminClient
    .from("dataset_files")
    .select("relative_path, storage_path, content_type")
    .eq("dataset_id", body.dataset_id)
    .eq("upload_status", "uploaded")
    .in("relative_path", body.paths);

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

  // --- 4. Generate signed read URLs (valid 1 hour) ---
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
