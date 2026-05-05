import { supabase } from "@/integrations/supabase/client";
import type { Challenge, PublicUserProfile, PublicUserProfileStats } from "@/types";

export const userProfileService = {
  async getPublicProfile(userId: string): Promise<PublicUserProfile | null> {
    const { data, error } = await supabase
      .from("public_profiles")
      .select("id, display_name, avatar_url, member_since")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return (data as PublicUserProfile | null) ?? null;
  },

  async getProfileStats(userId: string): Promise<PublicUserProfileStats> {
    const { data, error } = await supabase
      .rpc("get_public_profile_stats", { target_user_id: userId })
      .single();

    if (error) throw error;

    return {
      total_challenges_created: Number((data as any)?.total_challenges_created ?? 0),
      total_successful_participations: Number((data as any)?.total_successful_participations ?? 0),
      total_datasets_uploaded: Number((data as any)?.total_datasets_uploaded ?? 0),
    };
  },

  async listPublicChallengesByUser(userId: string, page = 1, pageSize = 12): Promise<Challenge[]> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    return (data ?? []) as Challenge[];
  },
};
