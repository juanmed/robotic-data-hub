import { supabase } from "@/integrations/supabase/client";
import type { Dataset } from "@/types";

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
