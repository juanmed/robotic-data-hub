import { supabase } from "@/integrations/supabase/client";

/**
 * Encodes a manifest object to URL-safe Base64.
 * Handles Unicode characters properly and replaces URL-unsafe characters.
 */
function encodeManifest(manifest: unknown): string {
  const json = JSON.stringify(manifest);
  const base64 = btoa(
    encodeURIComponent(json).replace(
      /%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))
    )
  );
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Fetches the dataset manifest (with signed URLs) from the edge function,
 * base64-encodes it using URL-safe Base64, and opens the visualizer in a new tab.
 */
export async function openVisualizer(datasetId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("get-dataset-manifest", {
    body: { dataset_id: datasetId },
  });

  if (error) {
    throw new Error(error.message || "Failed to fetch dataset manifest");
  }

  const manifestBase64 = encodeManifest(data);

  const url = `https://viz.gamiphy.ai/?manifest=${manifestBase64}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
