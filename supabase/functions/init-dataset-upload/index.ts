/**
 * init-dataset-upload
 *
 * Initializes a dataset upload session for CLI-based ingestion.
 *
 * Expected CLI flow:
 *   Step 1: POST /functions/v1/init-dataset-upload  (this function)
 *           → returns dataset_id + signed upload URLs for each file
 *   Step 2: CLI uploads each file directly to its signed URL (PUT to Storage)
 *   Step 3: POST /functions/v1/finalize-dataset-upload (future function)
 *           → marks dataset as 'ready' after verifying all files uploaded
 *
 * Authentication:
 *   Authorization: Bearer <upload_key>
 *   The upload key is validated against the upload_keys table via SHA-256 hash.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** SHA-256 hash matching the frontend's hashKey implementation */
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  // --- 1. Extract upload key from Authorization header ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonError("Missing or malformed Authorization header. Expected: Bearer <upload_key>", 401);
  }
  const rawKey = authHeader.replace("Bearer ", "").trim();
  if (!rawKey || !rawKey.startsWith("gpai_upl_")) {
    return jsonError("Invalid upload key format. Keys must start with gpai_upl_", 401);
  }

  // --- 2. Create service-role Supabase client ---
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // --- 3. Validate upload key ---
  const keyHash = await sha256(rawKey);

  const { data: keyRow, error: keyError } = await supabase
    .from("upload_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (keyError) {
    console.error("Key lookup error:", keyError);
    return jsonError("Internal error validating key", 500);
  }
  if (!keyRow) {
    return jsonError("Invalid upload key", 401);
  }
  if (keyRow.revoked_at) {
    return jsonError("This upload key has been revoked", 403);
  }

  const userId = keyRow.user_id;

  // --- 4. Parse and validate request body ---
  let body: {
    dataset_name?: string;
    source_format?: string;
    files?: Array<{
      relative_path: string;
      size_bytes?: number;
      content_type?: string;
      checksum?: string;
    }>;
  };

  try {
    body = await req.json();
  } catch {
    return jsonError("Malformed JSON body", 400);
  }

  if (!body.dataset_name || typeof body.dataset_name !== "string") {
    return jsonError("Missing or invalid 'dataset_name'", 400);
  }
  if (!Array.isArray(body.files) || body.files.length === 0) {
    return jsonError("'files' must be a non-empty array", 400);
  }

  const sourceFormat = body.source_format || "lerobot";

  // Validate each file entry
  for (const f of body.files) {
    if (!f.relative_path || typeof f.relative_path !== "string") {
      return jsonError("Each file must have a valid 'relative_path'", 400);
    }
  }

  // --- 5. Create dataset record ---
  const { data: dataset, error: datasetError } = await supabase
    .from("datasets")
    .insert({
      user_id: userId,
      name: body.dataset_name,
      source_format: sourceFormat,
      status: "uploading",
    })
    .select("id")
    .single();

  if (datasetError || !dataset) {
    console.error("Dataset creation error:", datasetError);
    return jsonError("Failed to create dataset", 500);
  }

  const datasetId = dataset.id;

  // --- 6. Create file records and generate signed upload URLs ---
  const uploadUrls: Array<{
    relative_path: string;
    storage_path: string;
    signed_upload_url: string;
  }> = [];

  for (const f of body.files) {
    // Storage path: {user_id}/{dataset_id}/{relative_path}
    const storagePath = `${userId}/${datasetId}/${f.relative_path}`;

    // Insert file record
    const { error: fileError } = await supabase
      .from("dataset_files")
      .insert({
        dataset_id: datasetId,
        relative_path: f.relative_path,
        storage_path: storagePath,
        content_type: f.content_type || null,
        size_bytes: f.size_bytes || null,
        checksum: f.checksum || null,
        upload_status: "pending",
      });

    if (fileError) {
      console.error("File record creation error:", fileError);
      return jsonError(`Failed to register file: ${f.relative_path}`, 500);
    }

    // Generate signed upload URL (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("datasets")
      .createSignedUploadUrl(storagePath);

    if (signedError || !signedData) {
      console.error("Signed URL error:", signedError);
      return jsonError(`Failed to generate upload URL for: ${f.relative_path}`, 500);
    }

    uploadUrls.push({
      relative_path: f.relative_path,
      storage_path: storagePath,
      signed_upload_url: signedData.signedUrl,
    });
  }

  // --- 7. Update last_used_at on the upload key ---
  await supabase
    .from("upload_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id);

  // --- 8. Return success response ---
  return new Response(
    JSON.stringify({
      dataset_id: datasetId,
      upload_urls: uploadUrls,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
