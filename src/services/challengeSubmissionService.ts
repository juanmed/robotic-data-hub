import { supabase } from "@/integrations/supabase/client";
import type {
  ChallengeSubmission,
  ChallengeSubmissionEnriched,
  ParticipantSubmissionItem,
} from "@/types";

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

  async listForChallengeEnriched(challengeId: string): Promise<ChallengeSubmissionEnriched[]> {
    const rows = await this.listForChallenge(challengeId);
    if (rows.length === 0) return [];

    const datasetIds = [...new Set(rows.map((r) => r.dataset_id))];
    const submitterIds = [...new Set(rows.map((r) => r.submitter_id))];

    const [{ data: datasets, error: dsError }, { data: profiles, error: pError }] = await Promise.all([
      supabase
        .from("datasets")
        .select("id, display_name")
        .in("id", datasetIds),
      supabase
        .from("profiles")
        .select("id, name")
        .in("id", submitterIds),
    ]);
    if (dsError) throw dsError;
    if (pError) throw pError;

    const datasetMap = new Map<string, string>();
    const submitterMap = new Map<string, string>();

    for (const d of datasets ?? []) {
      datasetMap.set((d as any).id, (d as any).display_name ?? "");
    }
    for (const p of profiles ?? []) {
      submitterMap.set((p as any).id, (p as any).name ?? "Unknown");
    }

    return rows.map((row) => ({
      ...row,
      dataset_display_name: datasetMap.get(row.dataset_id) ?? null,
      submitter_name: submitterMap.get(row.submitter_id) ?? null,
    }));
  },

  async listMine(): Promise<ChallengeSubmission[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("challenge_submissions")
      .select("*")
      .eq("submitter_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ChallengeSubmission[];
  },

  async listMineEnriched(): Promise<ParticipantSubmissionItem[]> {
    const rows = await this.listMine();
    if (rows.length === 0) return [];

    const challengeIds = [...new Set(rows.map((r) => r.challenge_id))];
    const datasetIds = [...new Set(rows.map((r) => r.dataset_id))];

    const [{ data: challenges, error: chError }, { data: datasets, error: dsError }] = await Promise.all([
      supabase
        .from("challenges")
        .select("id, title, compensation_amount, compensation_per, currency, status")
        .in("id", challengeIds),
      supabase
        .from("datasets")
        .select("id, display_name")
        .in("id", datasetIds),
    ]);
    if (chError) throw chError;
    if (dsError) throw dsError;

    const challengeMap = new Map<string, ParticipantSubmissionItem["challenge"]>();
    const datasetMap = new Map<string, string>();

    for (const ch of challenges ?? []) {
      challengeMap.set((ch as any).id, (ch as any));
    }
    for (const ds of datasets ?? []) {
      datasetMap.set((ds as any).id, (ds as any).display_name ?? "");
    }

    return rows.map((row) => ({
      ...row,
      challenge: challengeMap.get(row.challenge_id) ?? null,
      dataset_display_name: datasetMap.get(row.dataset_id) ?? null,
    }));
  },

  async updateStatus(id: string, status: "accepted" | "rejected"): Promise<void> {
    const { error } = await supabase
      .from("challenge_submissions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async withdraw(id: string): Promise<void> {
    const { error } = await supabase
      .from("challenge_submissions")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
