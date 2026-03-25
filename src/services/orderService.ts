import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/types";

export const orderService = {
  async list(): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Order[];
  },

  async getByListing(listingId: string): Promise<Order | undefined> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("listing_id", listingId)
      .eq("status", "completed")
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Order) ?? undefined;
  },

  async create(listingId: string, amount: number, currency: string = "USD"): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        listing_id: listingId,
        amount,
        currency,
        status: "completed",
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Order;
  },
};
