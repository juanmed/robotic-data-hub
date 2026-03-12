/**
 * finalize-dataset-upload
 *
 * Finalizes a dataset upload after all files have been uploaded to signed URLs.
 *
 * Expected CLI flow:
 *   Step 1: POST /functions/v1/init-dataset-upload → dataset_id + signed URLs
 *   Step 2: CLI uploads each file to its signed URL (PUT to Storage)
 *   Step 3: POST /functions/v1/finalize-dataset-upload (this function)
 *           → verifies files, marks dataset as 'ready'
 *
 * Future hooks (post-finalization):
 *   - Generate preview thumbnails / video clips
 *   - Parse metadata (e.g. meta/info.json) for visualization manifest
 *   - Build episode index for the dataset viewer
 *   - Trigger notification to dataset owner
 *
 * Authentication:
 *   Authorization: Bearer <upload_key>
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

function jsonOk(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
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
    return jsonError("Missing or malformed Authorization header. Expected: Bearer <upload_key>", 401);
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

  // --- 2. Parse request body ---
  let body: {
    dataset_id?: string;
    uploaded_files?: Array<{ relative_path: string }>;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError("Malformed JSON body", 400);
  }

  if (!body.dataset_id || typeof body.dataset_id !== "string") {
    return jsonError("Missing or invalid 'dataset_id'", 400);
  }
  if (!Array.isArray(body.uploaded_files) || body.uploaded_files.length === 0) {
    return jsonError("'uploaded_files' must be a non-empty array", 400);
  }

  // --- 3. Load and verify dataset ownership ---
  const { data: dataset, error: dsError } = await supabase
    .from("datasets")
    .select("id, user_id, status")
    .eq("id", body.dataset_id)
    .maybeSingle();

  if (dsError) {
    console.error("Dataset lookup error:", dsError);
    return jsonError("Internal error loading dataset", 500);
  }
  if (!dataset) return jsonError("Dataset not found", 404);
  if (dataset.user_id !== userId) return jsonError("Dataset not owned by this key's user", 403);

  // --- 4. Load all dataset files ---
  const { data: allFiles, error: filesError } = await supabase
    .from("dataset_files")
    .select("id, relative_path, upload_status")
    .eq("dataset_id", body.dataset_id);

  if (filesError) {
    console.error("Files lookup error:", filesError);
    return jsonError("Internal error loading files", 500);
  }

  const fileMap = new Map(
    (allFiles ?? []).map((f) => [f.relative_path, f])
  );

  // --- 5. Mark uploaded files ---
  const invalidPaths: string[] = [];
  let markedCount = 0;

  for (const uf of body.uploaded_files) {
    if (!uf.relative_path || typeof uf.relative_path !== "string") {
      invalidPaths.push("(invalid entry)");
      continue;
    }
    const existing = fileMap.get(uf.relative_path);
    if (!existing) {
      invalidPaths.push(uf.relative_path);
      continue;
    }

    if (existing.upload_status !== "uploaded") {
      const { error: updateErr } = await supabase
        .from("dataset_files")
        .update({ upload_status: "uploaded" })
        .eq("id", existing.id);

      if (updateErr) {
        console.error("File update error:", updateErr);
        return jsonError(`Failed to update file: ${uf.relative_path}`, 500);
      }
    }
    markedCount++;
  }

  if (invalidPaths.length > 0) {
    return jsonError(
      `These file paths were not found in the dataset: ${invalidPaths.join(", ")}`,
      400
    );
  }

  // --- 6. Determine final dataset status ---
  // Re-fetch to get updated counts
  const { data: updatedFiles } = await supabase
    .from("dataset_files")
    .select("upload_status")
    .eq("dataset_id", body.dataset_id);

  const totalCount = updatedFiles?.length ?? 0;
  const uploadedCount = updatedFiles?.filter((f) => f.upload_status === "uploaded").length ?? 0;
  const allUploaded = totalCount > 0 && uploadedCount === totalCount;
  const newStatus = allUploaded ? "ready" : "uploading";

  await supabase
    .from("datasets")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", body.dataset_id);

  // --- 7. Update last_used_at ---
  await supabase
    .from("upload_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id);

  // --- 8. Future hooks placeholder ---
  // TODO: If status === 'ready':
  //   - Parse meta/info.json to extract episode metadata
  //   - Generate video preview thumbnails
  //   - Build visualization manifest for the dataset viewer
  //   - Send notification to dataset owner

  return jsonOk({
    dataset_id: body.dataset_id,
    status: newStatus,
    uploaded_count: uploadedCount,
    total_count: totalCount,
  });
});
