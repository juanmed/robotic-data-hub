import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

type ChallengeSubmissionAccessRow = {
  submitter_id: string;
  status: "pending" | "accepted" | "rejected";
  challenge_id: string;
};

export type DatasetAccessResolution = {
  isDatasetOwner: boolean;
  isSubmitter: boolean;
  isChallengeOwner: boolean;
  isAcceptedChallengeOwner: boolean;
  submissionCount: number;
};

export async function resolveDatasetAccess(params: {
  supabaseUrl: string;
  serviceRoleKey: string;
  datasetId: string;
  userId: string;
  datasetOwnerId: string;
}) {
  const adminClient = createClient(params.supabaseUrl, params.serviceRoleKey);

  const isDatasetOwner = params.datasetOwnerId === params.userId;
  if (isDatasetOwner) {
    return {
      data: {
        isDatasetOwner: true,
        isSubmitter: false,
        isChallengeOwner: false,
        isAcceptedChallengeOwner: false,
        submissionCount: 0,
      } satisfies DatasetAccessResolution,
      error: null,
    };
  }

  const { data: submissionRows, error: submissionError } = await adminClient
    .from("challenge_submissions")
    .select("challenge_id, submitter_id, status")
    .eq("dataset_id", params.datasetId);

  if (submissionError) {
    return { data: null, error: submissionError };
  }

  const rows = (submissionRows ?? []) as ChallengeSubmissionAccessRow[];
  const isSubmitter = rows.some((row) => row.submitter_id === params.userId);

  const challengeIds = [...new Set(rows.map((row) => row.challenge_id))];
  if (challengeIds.length === 0) {
    return {
      data: {
        isDatasetOwner: false,
        isSubmitter,
        isChallengeOwner: false,
        isAcceptedChallengeOwner: false,
        submissionCount: rows.length,
      } satisfies DatasetAccessResolution,
      error: null,
    };
  }

  const { data: ownedChallenges, error: ownedChallengesError } = await adminClient
    .from("challenges")
    .select("id")
    .eq("user_id", params.userId)
    .in("id", challengeIds);

  if (ownedChallengesError) {
    return { data: null, error: ownedChallengesError };
  }

  const ownedChallengeIds = new Set((ownedChallenges ?? []).map((row: any) => row.id as string));
  const isChallengeOwner = rows.some((row) => ownedChallengeIds.has(row.challenge_id));
  const isAcceptedChallengeOwner = rows.some(
    (row) => row.status === "accepted" && ownedChallengeIds.has(row.challenge_id),
  );

  return {
    data: {
      isDatasetOwner: false,
      isSubmitter,
      isChallengeOwner,
      isAcceptedChallengeOwner,
      submissionCount: rows.length,
    } satisfies DatasetAccessResolution,
    error: null,
  };
}
