import { supabase } from "@/integrations/supabase/client";
import type { Dataset, DatasetFile } from "@/types";

export async function listDatasets(): Promise<(Dataset & { file_count: number })[]> {
  const { data, error } = await supabase
    .from("datasets")
    .select("*, dataset_files(id)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    source_format: row.source_format,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    file_count: Array.isArray(row.dataset_files) ? row.dataset_files.length : 0,
  }));
}

export async function getDataset(id: string): Promise<Dataset | null> {
  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    source_format: data.source_format,
    status: data.status as Dataset["status"],
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function getDatasetFiles(datasetId: string): Promise<DatasetFile[]> {
  const { data, error } = await supabase
    .from("dataset_files")
    .select("*")
    .eq("dataset_id", datasetId)
    .order("relative_path", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    dataset_id: row.dataset_id,
    relative_path: row.relative_path,
    storage_path: row.storage_path,
    content_type: row.content_type,
    size_bytes: row.size_bytes,
    checksum: row.checksum,
    upload_status: row.upload_status,
    created_at: row.created_at,
  }));
}

export interface SignedFileUrl {
  relative_path: string;
  signed_url: string | null;
  content_type: string | null;
}

export async function getDatasetFileUrls(
  datasetId: string,
  paths?: string[]
): Promise<SignedFileUrl[]> {
  const { data, error } = await supabase.functions.invoke("dataset-read-urls", {
    body: { dataset_id: datasetId, paths },
  });

  if (error) throw new Error(error.message || "Failed to get file URLs");
  return data?.urls ?? [];
}
