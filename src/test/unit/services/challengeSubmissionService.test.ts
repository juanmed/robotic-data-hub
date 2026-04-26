import { describe, it, expect, beforeEach, vi } from "vitest";
import { challengeSubmissionService } from "@/services/challengeSubmissionService";

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

const mockSubmission = {
  id: "sub_001",
  challenge_id: "ch_001",
  dataset_id: "ds_001",
  submitter_id: "usr_002",
  message: "This dataset matches your requirements",
  status: "pending",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("challengeSubmissionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submit", () => {
    it("creates submission with pending status", async () => {
      supabaseMock.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "usr_002" } },
      });
      supabaseMock.supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubmission,
              error: null,
            }),
          }),
        }),
      });

      const result = await challengeSubmissionService.submit({
        challenge_id: "ch_001",
        dataset_id: "ds_001",
        message: "This dataset matches your requirements",
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("pending");
    });

    it("throws when not authenticated", async () => {
      supabaseMock.supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(challengeSubmissionService.submit({
        challenge_id: "ch_001",
        dataset_id: "ds_001",
        message: "",
      })).rejects.toThrow("Not authenticated");
    });
  });

  describe("listForChallenge", () => {
    it("returns submissions for a given challenge", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockSubmission],
              error: null,
            }),
          }),
        }),
      });

      const result = await challengeSubmissionService.listForChallenge("ch_001");
      expect(result).toHaveLength(1);
      expect(result[0].challenge_id).toBe("ch_001");
    });
  });

  describe("listMine", () => {
    it("returns user's own submissions", async () => {
      supabaseMock.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "usr_002" } },
      });
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockSubmission],
              error: null,
            }),
          }),
        }),
      });

      const result = await challengeSubmissionService.listMine();
      expect(result).toHaveLength(1);
    });

    it("returns empty array when not authenticated", async () => {
      supabaseMock.supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await challengeSubmissionService.listMine();

      expect(result).toEqual([]);
      expect(supabaseMock.supabase.from).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("updates to accepted", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(
        challengeSubmissionService.updateStatus("sub_001", "accepted")
      ).resolves.toBeUndefined();
    });

    it("updates to rejected", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(
        challengeSubmissionService.updateStatus("sub_001", "rejected")
      ).resolves.toBeUndefined();
    });
  });

  describe("withdraw", () => {
    it("deletes submission by id", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(
        challengeSubmissionService.withdraw("sub_001")
      ).resolves.toBeUndefined();
    });
  });

  describe("listMineEnriched", () => {
    it("returns submissions enriched with challenge and dataset metadata", async () => {
      vi.spyOn(challengeSubmissionService, "listMine").mockResolvedValue([mockSubmission as any]);

      supabaseMock.supabase.from
        .mockImplementationOnce(() => ({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{
                id: "ch_001",
                title: "Challenge title",
                compensation_amount: 1000,
                compensation_per: "dataset",
                currency: "USD",
                status: "active",
              }],
              error: null,
            }),
          }),
        }))
        .mockImplementationOnce(() => ({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: "ds_001", display_name: "Dataset 1" }],
              error: null,
            }),
          }),
        }));

      const result = await challengeSubmissionService.listMineEnriched();

      expect(result).toHaveLength(1);
      expect(result[0].dataset_display_name).toBe("Dataset 1");
      expect(result[0].challenge?.title).toBe("Challenge title");
    });
  });
});
