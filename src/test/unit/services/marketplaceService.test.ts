import { describe, it, expect, beforeEach, vi } from "vitest";
import { getMarketplaceFileUrls } from "@/services/marketplaceService";

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

describe("marketplaceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMarketplaceFileUrls", () => {
    it("invokes the marketplace-dataset-urls edge function with correct body", async () => {
      supabaseMock.supabase.functions.invoke.mockResolvedValue({
        data: { urls: [] },
        error: null,
      });

      await getMarketplaceFileUrls("ds_001", ["path/to/file.mcap"]);

      expect(supabaseMock.supabase.functions.invoke).toHaveBeenCalledWith(
        "marketplace-dataset-urls",
        { body: { dataset_id: "ds_001", paths: ["path/to/file.mcap"] } }
      );
    });

    it("returns the urls array from the response", async () => {
      const mockUrls = [
        { relative_path: "data.mcap", signed_url: "https://example.com/signed/data.mcap" },
        { relative_path: "meta.json", signed_url: "https://example.com/signed/meta.json" },
      ];
      supabaseMock.supabase.functions.invoke.mockResolvedValue({
        data: { urls: mockUrls },
        error: null,
      });

      const result = await getMarketplaceFileUrls("ds_001", ["data.mcap", "meta.json"]);
      expect(result).toEqual(mockUrls);
    });

    it("returns [] when data.urls is absent", async () => {
      supabaseMock.supabase.functions.invoke.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await getMarketplaceFileUrls("ds_001", ["file.mcap"]);
      expect(result).toEqual([]);
    });

    it("returns [] when data is null", async () => {
      supabaseMock.supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getMarketplaceFileUrls("ds_001", ["file.mcap"]);
      expect(result).toEqual([]);
    });

    it("throws error with Supabase message when error is present", async () => {
      supabaseMock.supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: "Unauthorized access" },
      });

      await expect(getMarketplaceFileUrls("ds_001", ["file.mcap"])).rejects.toThrow(
        "Unauthorized access"
      );
    });

    it("throws generic message when error has no message", async () => {
      supabaseMock.supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: {},
      });

      await expect(getMarketplaceFileUrls("ds_001", ["file.mcap"])).rejects.toThrow(
        "Failed to get marketplace file URLs"
      );
    });

    it("throws when invoke itself rejects", async () => {
      supabaseMock.supabase.functions.invoke.mockRejectedValue(
        new Error("Network error")
      );

      await expect(getMarketplaceFileUrls("ds_001", ["file.mcap"])).rejects.toThrow(
        "Network error"
      );
    });

    it("sends empty paths array without error", async () => {
      supabaseMock.supabase.functions.invoke.mockResolvedValue({
        data: { urls: [] },
        error: null,
      });

      const result = await getMarketplaceFileUrls("ds_001", []);
      expect(supabaseMock.supabase.functions.invoke).toHaveBeenCalledWith(
        "marketplace-dataset-urls",
        { body: { dataset_id: "ds_001", paths: [] } }
      );
      expect(result).toEqual([]);
    });
  });
});
