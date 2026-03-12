/**
 * abort-dataset-upload
 *
 * Aborts a dataset upload: deletes storage files, file records, and the dataset record.
 *
 * Body: { dataset_id: string }
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

  // --- 2. Parse body ---
  let body: { dataset_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Malformed JSON body", 400);
  }

  if (!body.dataset_id || typeof body.dataset_id !== "string") {
    return jsonError("Missing or invalid 'dataset_id'", 400);
  }

  // --- 3. Verify dataset ownership ---
  const { data: dataset, error: dsError } = await supabase
    .from("datasets")
    .select("id, user_id")
    .eq("id", body.dataset_id)
    .maybeSingle();

  if (dsError) {
    console.error("Dataset lookup error:", dsError);
    return jsonError("Internal error loading dataset", 500);
  }
  if (!dataset) return jsonError("Dataset not found", 404);
  if (dataset.user_id !== userId) return jsonError("Access denied", 403);

  // --- 4. Load file records to get storage paths ---
  const { data: files } = await supabase
    .from("dataset_files")
    .select("storage_path")
    .eq("dataset_id", body.dataset_id);

  // --- 5. Delete files from storage ---
  if (files && files.length > 0) {
    const storagePaths = files.map((f) => f.storage_path);
    const { error: removeError } = await supabase.storage
      .from("datasets")
      .remove(storagePaths);

    if (removeError) {
      console.error("Storage cleanup error:", removeError);
      // Continue anyway to clean up DB records
    }
  }

  // --- 6. Delete file records ---
  await supabase
    .from("dataset_files")
    .delete()
    .eq("dataset_id", body.dataset_id);

  // --- 7. Delete dataset record ---
  await supabase
    .from("datasets")
    .delete()
    .eq("id", body.dataset_id);

  return new Response(
    JSON.stringify({ dataset_id: body.dataset_id, status: "aborted" }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
