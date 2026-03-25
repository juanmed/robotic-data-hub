import { supabase } from "@/integrations/supabase/client";
import type { Listing, EnrichedListing } from "@/types";

export const listingService = {
  async list(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Listing[];
  },

  async listEnriched(): Promise<EnrichedListing[]> {
    // 1. Fetch all published listings
    const listings = await this.list();
    if (listings.length === 0) return [];

    // 2. Batch-fetch datasets with file paths
    const datasetIds = [...new Set(listings.map((l) => l.dataset_id))] as string[];
    const { data: datasets, error: dsError } = await supabase
      .from("datasets")
      .select("id, dataset_files(relative_path)")
      .in("id", datasetIds);
    if (dsError) throw dsError;

    const datasetFileMap = new Map<string, string[]>();
    for (const ds of datasets ?? []) {
      const files = Array.isArray((ds as any).dataset_files) ? (ds as any).dataset_files : [];
      datasetFileMap.set(ds.id, files.map((f: any) => f.relative_path as string));
    }

    // 3. Batch-fetch creator profiles
    const userIds = [...new Set(listings.map((l) => l.user_id))] as string[];
    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);
    if (profError) throw profError;

    const profileMap = new Map<string, string>();
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p.name || "Unknown");
    }

    // 4. Combine
    return listings.map((l) => ({
      ...l,
      creator_name: profileMap.get(l.user_id) || "Unknown",
      file_paths: datasetFileMap.get(l.dataset_id) || [],
    }));
  },

  async get(id: string): Promise<Listing | undefined> {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Listing) ?? undefined;
  },

  async getByDataset(datasetId: string): Promise<Listing | undefined> {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("dataset_id", datasetId)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Listing) ?? undefined;
  },

  async publish(listing: Omit<Listing, "id" | "download_count" | "created_at" | "updated_at">): Promise<Listing> {
    const { data, error } = await supabase
      .from("listings")
      .insert(listing)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Listing;
  },

  async update(id: string, updates: Partial<Pick<Listing, "title" | "description" | "price_amount" | "currency" | "license" | "tags" | "published">>): Promise<Listing> {
    const { data, error } = await supabase
      .from("listings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Listing;
  },

  async unpublish(id: string): Promise<void> {
    const { error } = await supabase
      .from("listings")
      .update({ published: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};
