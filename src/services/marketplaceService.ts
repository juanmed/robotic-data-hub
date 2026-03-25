import { supabase } from "@/integrations/supabase/client";
import type { SignedFileUrl } from "@/services/datasetService";

/**
 * Fetches signed URLs for dataset files via the marketplace edge function.
 * Does NOT require dataset ownership — only that the dataset has a published listing.
 */
export async function getMarketplaceFileUrls(
  datasetId: string,
  paths: string[]
): Promise<SignedFileUrl[]> {
  const { data, error } = await supabase.functions.invoke("marketplace-dataset-urls", {
    body: { dataset_id: datasetId, paths },
  });

  if (error) throw new Error(error.message || "Failed to get marketplace file URLs");
  return data?.urls ?? [];
}
