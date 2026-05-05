import { describe, it, expect, beforeEach, vi } from "vitest";
import { challengeService } from "@/services/challengeService";

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

const mockChallenge = {
  id: "ch_001",
  user_id: "usr_001",
  title: "Kitchen manipulation dataset",
  description: "Need datasets of kitchen object manipulation",
  status: "active",
  compensation_amount: 5000,
  compensation_per: "dataset",
  currency: "USD",
  deadline: null,
  constraints: "Must use UR5 robot",
  conditions: "At least 100 episodes",
  tags: ["manipulation", "kitchen"],
  submission_count: 3,
  published_at: new Date().toISOString(),
  closed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockDraftChallenge = {
  ...mockChallenge,
  id: "ch_002",
  status: "draft",
  published_at: null,
};

describe("challengeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listMine", () => {
    it("filters by the authenticated user's id", async () => {
      supabaseMock.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "usr_001" } },
      });
      const eqMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [mockChallenge, mockDraftChallenge],
          error: null,
        }),
      });
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqMock }),
      });

      const result = await challengeService.listMine();
      expect(eqMock).toHaveBeenCalledWith("user_id", "usr_001");
      expect(result).toHaveLength(2);
    });

    it("does not return challenges owned by other users", async () => {
      supabaseMock.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "usr_other" } },
      });
      const otherUserChallenge = { ...mockChallenge, user_id: "usr_001" };
      const eqMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqMock }),
      });

      const result = await challengeService.listMine();
      expect(eqMock).toHaveBeenCalledWith("user_id", "usr_other");
      expect(result).toHaveLength(0);
      expect(result).not.toContainEqual(otherUserChallenge);
    });

    it("returns empty array when unauthenticated", async () => {
      supabaseMock.supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await challengeService.listMine();
      expect(result).toEqual([]);
    });

    it("returns empty array when user has no challenges", async () => {
      supabaseMock.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "usr_001" } },
      });
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const result = await challengeService.listMine();
      expect(result).toEqual([]);
    });
  });

  describe("get", () => {
    it("returns challenge by id", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockChallenge,
              error: null,
            }),
          }),
        }),
      });

      const result = await challengeService.get("ch_001");
      expect(result).toBeDefined();
      expect(result?.id).toBe("ch_001");
      expect(result?.title).toBe("Kitchen manipulation dataset");
    });

    it("returns undefined for non-existent id", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const result = await challengeService.get("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("create", () => {
    it("creates challenge with draft status", async () => {
      supabaseMock.supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "usr_001" } },
      });
      supabaseMock.supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDraftChallenge,
              error: null,
            }),
          }),
        }),
      });

      const result = await challengeService.create({
        title: "Test challenge",
        description: "Test description",
        compensation_amount: 0,
        compensation_per: "dataset",
        currency: "USD",
        deadline: null,
        constraints: "",
        conditions: "",
        tags: [],
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("draft");
    });

    it("throws when not authenticated", async () => {
      supabaseMock.supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      await expect(challengeService.create({
        title: "Test",
        description: "",
        compensation_amount: 0,
        compensation_per: "dataset",
        currency: "USD",
        deadline: null,
        constraints: "",
        conditions: "",
        tags: [],
      })).rejects.toThrow("Not authenticated");
    });
  });

  describe("update", () => {
    it("updates specified fields", async () => {
      const updated = { ...mockChallenge, title: "Updated title" };
      supabaseMock.supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updated,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await challengeService.update("ch_001", { title: "Updated title" });
      expect(result.title).toBe("Updated title");
    });
  });

  describe("publish", () => {
    it("sets status to active", async () => {
      const published = { ...mockDraftChallenge, status: "active" };
      supabaseMock.supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: published,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await challengeService.publish("ch_002");
      expect(result.status).toBe("active");
    });
  });

  describe("setStatus", () => {
    it("sets to inactive", async () => {
      const inactive = { ...mockChallenge, status: "inactive" };
      supabaseMock.supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: inactive,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await challengeService.setStatus("ch_001", "inactive");
      expect(result.status).toBe("inactive");
    });

    it("sets to closed", async () => {
      const closed = { ...mockChallenge, status: "closed", closed_at: new Date().toISOString() };
      supabaseMock.supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: closed,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await challengeService.setStatus("ch_001", "closed");
      expect(result.status).toBe("closed");
    });
  });

  describe("deleteDraft", () => {
    it("deletes draft challenge", async () => {
      // Mock get() for the draft check
      supabaseMock.supabase.from.mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockDraftChallenge,
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }));

      await expect(challengeService.deleteDraft("ch_002")).resolves.toBeUndefined();
    });

    it("rejects deletion of non-draft challenges", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockChallenge, // status: "active"
              error: null,
            }),
          }),
        }),
      });

      await expect(challengeService.deleteDraft("ch_001")).rejects.toThrow(
        "Only draft challenges can be deleted"
      );
    });
  });

  describe("listEnriched", () => {
    const mockActiveChallenge = {
      id: "ch_001", user_id: "usr_001", title: "Kitchen manipulation",
      description: "Need kitchen data", status: "active",
      compensation_amount: 5000, compensation_per: "dataset", currency: "USD",
      deadline: null, constraints: "", conditions: "", tags: [],
      submission_count: 0, published_at: new Date().toISOString(),
      closed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };

    it("returns [] when no active challenges exist", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const result = await challengeService.listEnriched();
      expect(result).toEqual([]);
    });

    it("merges creator names from public profiles", async () => {
      supabaseMock.supabase.from.mockImplementation((table: string) => {
        if (table === "challenges") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [mockActiveChallenge], error: null }),
              }),
            }),
          };
        }
        if (table === "public_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [{ id: "usr_001", display_name: "Jane" }], error: null }),
            }),
          };
        }
        if (table === "challenge_media") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      supabaseMock.supabase.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({ data: null }),
      });

      const result = await challengeService.listEnriched();
      expect(result[0].creator_name).toBe("Jane");
    });

    it("falls back to 'Unknown' when profile is missing", async () => {
      supabaseMock.supabase.from.mockImplementation((table: string) => {
        if (table === "challenges") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [mockActiveChallenge], error: null }),
              }),
            }),
          };
        }
        if (table === "public_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "challenge_media") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const result = await challengeService.listEnriched();
      expect(result[0].creator_name).toBe("Unknown");
    });

    it("sets preview_url to signed URL when media exists", async () => {
      const mockMedia = [{ challenge_id: "ch_001", storage_path: "ch_001/video.mp4" }];

      supabaseMock.supabase.from.mockImplementation((table: string) => {
        if (table === "challenges") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [mockActiveChallenge], error: null }),
              }),
            }),
          };
        }
        if (table === "public_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "challenge_media") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockMedia, error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      supabaseMock.supabase.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "https://signed.url/video.mp4" },
        }),
      });

      const result = await challengeService.listEnriched();
      expect(result[0].preview_url).toBe("https://signed.url/video.mp4");
    });

    it("sets preview_url to null when no media exists", async () => {
      supabaseMock.supabase.from.mockImplementation((table: string) => {
        if (table === "challenges") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [mockActiveChallenge], error: null }),
              }),
            }),
          };
        }
        if (table === "public_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "challenge_media") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const result = await challengeService.listEnriched();
      expect(result[0].preview_url).toBeNull();
    });

    it("sets preview_url to null when createSignedUrl returns no URL", async () => {
      const mockMedia = [{ challenge_id: "ch_001", storage_path: "ch_001/video.mp4" }];

      supabaseMock.supabase.from.mockImplementation((table: string) => {
        if (table === "challenges") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [mockActiveChallenge], error: null }),
              }),
            }),
          };
        }
        if (table === "public_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "challenge_media") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockMedia, error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });
      supabaseMock.supabase.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({ data: null }),
      });

      const result = await challengeService.listEnriched();
      expect(result[0].preview_url).toBeNull();
    });

    it("throws when challenges query fails", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
          }),
        }),
      });

      await expect(challengeService.listEnriched()).rejects.toBeTruthy();
    });
  });
});
