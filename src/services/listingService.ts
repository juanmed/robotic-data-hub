import { supabase } from "@/integrations/supabase/client";
import type { Listing } from "@/types";

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
