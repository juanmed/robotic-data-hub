import { supabase } from "@/integrations/supabase/client";
import type { ChallengeSubmission } from "@/types";

export const challengeSubmissionService = {
  async submit(data: {
    challenge_id: string;
    dataset_id: string;
    message: string;
  }): Promise<ChallengeSubmission> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: result, error } = await supabase
      .from("challenge_submissions")
      .insert({
        ...data,
        submitter_id: user.id,
      })
      .select()
      .single();
    if (error) throw error;
    return result as unknown as ChallengeSubmission;
  },

  async listForChallenge(challengeId: string): Promise<ChallengeSubmission[]> {
    const { data, error } = await supabase
      .from("challenge_submissions")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ChallengeSubmission[];
  },

  async listMine(): Promise<ChallengeSubmission[]> {
    const { data, error } = await supabase
      .from("challenge_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ChallengeSubmission[];
  },

  async updateStatus(id: string, status: "accepted" | "rejected"): Promise<void> {
    const { error } = await supabase
      .from("challenge_submissions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};
