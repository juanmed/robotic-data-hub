import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches the dataset manifest (with signed URLs) from the edge function,
 * base64-encodes it, and opens the visualizer in a new tab.
 */
export async function openVisualizer(datasetId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("get-dataset-manifest", {
    body: { dataset_id: datasetId },
  });

  if (error) {
    throw new Error(error.message || "Failed to fetch dataset manifest");
  }

  const manifestJson = JSON.stringify(data);
  const manifestBase64 = btoa(manifestJson)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const url = `https://viz.gamiphy.ai/?manifest=${manifestBase64}`;
  window.open(url, "_blank");
}
