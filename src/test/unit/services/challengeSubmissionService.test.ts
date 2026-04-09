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
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockSubmission],
            error: null,
          }),
        }),
      });

      const result = await challengeSubmissionService.listMine();
      expect(result).toHaveLength(1);
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
});
