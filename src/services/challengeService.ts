import { supabase } from "@/integrations/supabase/client";
import type { Challenge, EnrichedChallenge } from "@/types";

export const challengeService = {
  async listEnriched(): Promise<EnrichedChallenge[]> {
    const { data: challenges, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!challenges || challenges.length === 0) return [];

    const userIds = [...new Set(challenges.map((c: any) => c.user_id))] as string[];
    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);
    if (profError) throw profError;

    const profileMap = new Map<string, string>();
    for (const p of profiles ?? []) {
      profileMap.set(p.id, p.name || "Unknown");
    }

    const challengeIds = challenges.map((c: any) => c.id) as string[];
    const { data: media, error: mediaError } = await supabase
      .from("challenge_media")
      .select("challenge_id, storage_path")
      .in("challenge_id", challengeIds)
      .order("sort_order", { ascending: true });
    if (mediaError) throw mediaError;

    const previewMap = new Map<string, string>();
    for (const m of media ?? []) {
      if (!previewMap.has((m as any).challenge_id)) {
        previewMap.set((m as any).challenge_id, (m as any).storage_path);
      }
    }

    const enriched: EnrichedChallenge[] = [];
    for (const c of challenges) {
      const ch = c as unknown as Challenge;
      let previewUrl: string | null = null;
      const storagePath = previewMap.get(ch.id);
      if (storagePath) {
        const { data: urlData } = await supabase.storage
          .from("challenge-media")
          .createSignedUrl(storagePath, 60);
        previewUrl = urlData?.signedUrl ?? null;
      }
      enriched.push({
        ...ch,
        creator_name: profileMap.get(ch.user_id) || "Unknown",
        preview_url: previewUrl,
      });
    }

    return enriched;
  },

  async listMine(): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Challenge[];
  },

  async get(id: string): Promise<Challenge | undefined> {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Challenge) ?? undefined;
  },

  async create(input: {
    title: string;
    description: string;
    compensation_amount: number;
    compensation_per: "dataset" | "challenge";
    currency: string;
    deadline: string | null;
    constraints: string;
    conditions: string;
    tags: string[];
  }): Promise<Challenge> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("challenges")
      .insert({
        user_id: user.id,
        ...input,
        status: "draft",
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Challenge;
  },

  async update(
    id: string,
    updates: Partial<Pick<Challenge,
      "title" | "description" | "compensation_amount" | "compensation_per" |
      "currency" | "deadline" | "constraints" | "conditions" | "tags"
    >>
  ): Promise<Challenge> {
    const { data, error } = await supabase
      .from("challenges")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Challenge;
  },

  async publish(id: string): Promise<Challenge> {
    const { data, error } = await supabase
      .from("challenges")
      .update({ status: "active" })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Challenge;
  },

  async setStatus(id: string, status: "active" | "inactive" | "closed"): Promise<Challenge> {
    const { data, error } = await supabase
      .from("challenges")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Challenge;
  },

  async deleteDraft(id: string): Promise<void> {
    const challenge = await this.get(id);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.status !== "draft") throw new Error("Only draft challenges can be deleted");

    const { error } = await supabase
      .from("challenges")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
