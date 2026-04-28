import { supabase } from "@/integrations/supabase/client";
import type { Dataset, DatasetFile } from "@/types";

export interface DatasetListItem extends Dataset {
  file_count: number;
  total_size_bytes: number;
  file_paths: string[];
}

export async function listDatasets(): Promise<DatasetListItem[]> {
  const { data, error } = await supabase
    .from("datasets")
    .select("*, dataset_files(id, size_bytes, relative_path)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const files = Array.isArray(row.dataset_files) ? row.dataset_files : [];
    return {
      id: row.id,
      user_id: row.user_id,
      display_name: row.display_name,
      source_repo_id: row.source_repo_id,
      status: row.status,
      metadata: row.metadata,
      created_at: row.created_at,
      confirmed_at: row.confirmed_at,
      file_count: files.length,
      total_size_bytes: files.reduce((sum: number, f: any) => sum + (f.size_bytes || 0), 0),
      file_paths: files.map((f: any) => f.relative_path as string),
    };
  });
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
    display_name: data.display_name,
    source_repo_id: data.source_repo_id,
    status: data.status as Dataset["status"],
    metadata: data.metadata as Record<string, unknown> | null,
    created_at: data.created_at,
    confirmed_at: data.confirmed_at,
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
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Failed to resolve authentication session");
  }

  if (!session?.access_token) {
    throw new Error("Please sign in to access dataset files");
  }

  const invokeReadUrls = async (accessToken: string) => {
    return supabase.functions.invoke("dataset-read-urls", {
      body: { dataset_id: datasetId, paths },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  let { data, error } = await invokeReadUrls(session.access_token);

  const getStatus = (err: unknown): number | undefined => {
    return (err as { context?: { status?: number }; status?: number })?.context?.status
      ?? (err as { status?: number })?.status;
  };

  const status = getStatus(error);
  if (error && (status === 401 || status === 403)) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session?.access_token) {
      const retried = await invokeReadUrls(refreshed.session.access_token);
      data = retried.data;
      error = retried.error;
    }
  }

  if (error) {
    const finalStatus = getStatus(error);
    if (finalStatus === 403) {
      throw new Error("You do not have permission to access these dataset files");
    }
    throw new Error((error as { message?: string }).message || "Failed to get file URLs");
  }

  return data?.urls ?? [];
}

export async function deleteDataset(datasetId: string): Promise<void> {
  // Delete dataset files first (cascade should handle this, but be explicit)
  const { error: filesError } = await supabase
    .from("dataset_files")
    .delete()
    .eq("dataset_id", datasetId);

  if (filesError) throw new Error(filesError.message);

  const { error } = await supabase
    .from("datasets")
    .delete()
    .eq("id", datasetId);

  if (error) throw new Error(error.message);
}
