/**
 * init-dataset-upload
 *
 * Initializes a dataset upload session for CLI-based ingestion (LeRobot compatible).
 *
 * Authentication: Authorization: Bearer <upload_key>
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

  // --- 1. Validate upload key ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonError("Missing or malformed Authorization header", 401);
  }
  const rawKey = authHeader.replace("Bearer ", "").trim();
  if (!rawKey || !rawKey.startsWith("gpai_upl_")) {
    return jsonError("Invalid upload key format", 401);
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
    console.error("Key lookup error:", keyError);
    return jsonError("Internal error validating key", 500);
  }
  if (!keyRow) return jsonError("Invalid upload key", 401);
  if (keyRow.revoked_at) return jsonError("This upload key has been revoked", 403);

  const userId = keyRow.user_id;

  // --- 2. Parse request body (LeRobot shape) ---
  let body: {
    display_name?: string;
    source_repo_id?: string;
    metadata?: Record<string, unknown>;
    files?: Array<{
      path: string;
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

  if (!body.display_name || typeof body.display_name !== "string") {
    return jsonError("Missing or invalid 'display_name'", 400);
  }
  if (!Array.isArray(body.files) || body.files.length === 0) {
    return jsonError("'files' must be a non-empty array", 400);
  }
  for (const f of body.files) {
    if (!f.path || typeof f.path !== "string") {
      return jsonError("Each file must have a valid 'path'", 400);
    }
  }

  // --- 3. Create dataset record ---
  const { data: dataset, error: datasetError } = await supabase
    .from("datasets")
    .insert({
      user_id: userId,
      display_name: body.display_name,
      source_repo_id: body.source_repo_id || null,
      metadata: body.metadata || null,
      status: "uploading",
    })
    .select("id")
    .single();

  if (datasetError || !dataset) {
    console.error("Dataset creation error:", datasetError);
    return jsonError("Failed to create dataset", 500);
  }

  const datasetId = dataset.id;

  // --- 4. Create file records + signed upload URLs ---
  const uploadInstructions: Record<string, { url: string; method: string; headers: Record<string, string> }> = {};

  for (const f of body.files) {
    const storagePath = `${userId}/${datasetId}/${f.path}`;

    const { error: fileError } = await supabase
      .from("dataset_files")
      .insert({
        dataset_id: datasetId,
        relative_path: f.path,
        storage_path: storagePath,
        content_type: f.content_type || null,
        size_bytes: f.size_bytes || null,
        upload_status: "pending",
      });

    if (fileError) {
      console.error("File record creation error:", fileError);
      return jsonError(`Failed to register file: ${f.path}`, 500);
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("datasets")
      .createSignedUploadUrl(storagePath);

    if (signedError || !signedData) {
      console.error("Signed URL error:", signedError);
      return jsonError(`Failed to generate upload URL for: ${f.path}`, 500);
    }

    uploadInstructions[f.path] = {
      url: signedData.signedUrl,
      method: "PUT",
      headers: {},
    };
  }

  // --- 5. Update last_used_at ---
  await supabase
    .from("upload_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id);

  // --- 6. Return LeRobot-compatible response ---
  return new Response(
    JSON.stringify({
      dataset_id: datasetId,
      upload_instructions: uploadInstructions,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
