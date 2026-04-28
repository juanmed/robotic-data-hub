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
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Failed to resolve authentication session");
  }

  if (!session?.access_token) {
    throw new Error("Please sign in to visualize this dataset");
  }

  const invokeManifest = async (accessToken: string) => {
    return supabase.functions.invoke("get-dataset-manifest", {
      body: { dataset_id: datasetId },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  let { data, error } = await invokeManifest(session.access_token);

  const getStatus = (err: unknown): number | undefined => {
    return (err as { context?: { status?: number }; status?: number })?.context?.status
      ?? (err as { status?: number })?.status;
  };

  const status = getStatus(error);
  if (error && (status === 401 || status === 403)) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session?.access_token) {
      const retried = await invokeManifest(refreshed.session.access_token);
      data = retried.data;
      error = retried.error;
    }
  }

  if (error) {
    const finalStatus = getStatus(error);
    if (finalStatus === 403) {
      throw new Error("You do not have permission to visualize this dataset");
    }
    throw new Error((error as { message?: string }).message || "Failed to fetch dataset manifest");
  }

  const manifestBase64 = encodeManifest(data);

  const url = `https://viz.gamiphy.ai/?manifest=${manifestBase64}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
