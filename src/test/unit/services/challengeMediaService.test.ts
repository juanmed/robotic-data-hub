import { describe, it, expect, beforeEach, vi } from "vitest";
import { challengeMediaService } from "@/services/challengeMediaService";

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

const mockMedia = {
  id: "med_001",
  challenge_id: "ch_001",
  user_id: "usr_001",
  storage_path: "usr_001/ch_001/abc123-test.mp4",
  file_name: "test.mp4",
  content_type: "video/mp4",
  size_bytes: 1024000,
  sort_order: 0,
  created_at: new Date().toISOString(),
};

describe("challengeMediaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns media ordered by sort_order", async () => {
      const media2 = { ...mockMedia, id: "med_002", sort_order: 1 };
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockMedia, media2],
              error: null,
            }),
          }),
        }),
      });

      const result = await challengeMediaService.list("ch_001");
      expect(result).toHaveLength(2);
      expect(result[0].sort_order).toBe(0);
    });

    it("returns empty array for challenge with no media", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await challengeMediaService.list("ch_999");
      expect(result).toEqual([]);
    });
  });

  describe("getSignedUrl", () => {
    it("returns signed URL string", async () => {
      supabaseMock.supabase.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "https://example.com/signed-url" },
          error: null,
        }),
      });

      const url = await challengeMediaService.getSignedUrl("usr_001/ch_001/test.mp4");
      expect(url).toBe("https://example.com/signed-url");
    });
  });

  describe("delete", () => {
    it("removes storage file and database record", async () => {
      const removeMock = vi.fn().mockResolvedValue({ error: null });
      supabaseMock.supabase.storage.from.mockReturnValue({
        remove: removeMock,
      });
      supabaseMock.supabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await challengeMediaService.delete("med_001", "usr_001/ch_001/test.mp4");
      expect(removeMock).toHaveBeenCalledWith(["usr_001/ch_001/test.mp4"]);
    });
  });

  describe("upload", () => {
    it("uploads file and creates record", async () => {
      const file = new File(["test"], "test.mp4", { type: "video/mp4" });
      supabaseMock.supabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
      });
      supabaseMock.supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMedia,
              error: null,
            }),
          }),
        }),
      });

      const result = await challengeMediaService.upload("ch_001", "usr_001", file);
      expect(result).toBeDefined();
      expect(result.file_name).toBe("test.mp4");
    });
  });

  describe("reorder", () => {
    it("updates sort_order for given items", async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      supabaseMock.supabase.from.mockReturnValue({
        update: updateMock,
      });

      await challengeMediaService.reorder([
        { id: "med_001", sort_order: 1 },
        { id: "med_002", sort_order: 0 },
      ]);

      expect(updateMock).toHaveBeenCalledTimes(2);
    });
  });
});
