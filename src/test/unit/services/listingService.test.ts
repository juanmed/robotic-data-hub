import { describe, it, expect, beforeEach, vi } from "vitest";
import { listingService } from "@/services/listingService";

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

describe("listingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockListingData = {
      id: "lst_001",
      user_id: "usr_001",
      dataset_id: "dts_001",
      title: "Test Listing",
      description: "Test Description",
      price_amount: 5000,
      currency: "USD",
      platform_fee_bps: 1000,
      license: "CC-BY-4.0",
      tags: ["test"],
      published: true,
      download_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Mock from() to handle listings queries
    supabaseMock.supabase.from.mockImplementation((table: string) => {
      if (table === "listings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((key: string, value: any) => ({
              order: vi.fn().mockResolvedValue({
                data: [mockListingData],
                error: null,
              }),
              maybeSingle: vi.fn().mockResolvedValue({
                // Return undefined if querying for a non-existent ID
                data: value === "lst_001" ? mockListingData : null,
                error: null,
              }),
            })),
            order: vi.fn().mockResolvedValue({
              data: [mockListingData],
              error: null,
            }),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });
  });

  describe("list", () => {
    it("returns an array of listings", async () => {
      const listings = await listingService.list();
      expect(Array.isArray(listings)).toBe(true);
    });
  });

  describe("get", () => {
    it("returns a listing by id if exists", async () => {
      const listings = await listingService.list();
      if (listings.length > 0) {
        const listing = await listingService.get(listings[0].id);
        expect(listing).toBeDefined();
        expect(listing?.id).toBe(listings[0].id);
      }
    });

    it("returns undefined for non-existent listing", async () => {
      const listing = await listingService.get("00000000-0000-0000-0000-000000000000");
      expect(listing).toBeUndefined();
    });
  });

  describe("getByDataset", () => {
    it("returns undefined when no listing for dataset", async () => {
      const listing = await listingService.getByDataset("00000000-0000-0000-0000-000000000000");
      expect(listing).toBeUndefined();
    });
  });

  describe("listEnriched", () => {
    it("returns [] when no listings exist", async () => {
      supabaseMock.supabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }));

      const result = await listingService.listEnriched();
      expect(result).toEqual([]);
    });

    it("merges dataset file paths and creator names into enriched result", async () => {
      const mockListing = {
        id: "lst_001", user_id: "usr_001", dataset_id: "ds_001",
        title: "Test", description: "", price_amount: 0, currency: "USD",
        platform_fee_bps: 0, license: "CC-BY-4.0", tags: [], published: true,
        download_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      const mockDataset = { id: "ds_001", dataset_files: [{ relative_path: "data.mcap" }] };
      const mockProfile = { id: "usr_001", name: "Jane Doe" };

      supabaseMock.supabase.from.mockImplementation((table: string) => {
        if (table === "listings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [mockListing], error: null }),
              }),
            }),
          };
        }
        if (table === "datasets") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [mockDataset], error: null }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [mockProfile], error: null }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const result = await listingService.listEnriched();
      expect(result).toHaveLength(1);
      expect(result[0].creator_name).toBe("Jane Doe");
      expect(result[0].file_paths).toEqual(["data.mcap"]);
    });

    it("falls back to 'Unknown' when creator profile is missing", async () => {
      const mockListing = {
        id: "lst_001", user_id: "usr_missing", dataset_id: "ds_001",
        title: "Test", description: "", price_amount: 0, currency: "USD",
        platform_fee_bps: 0, license: "CC-BY-4.0", tags: [], published: true,
        download_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };

      supabaseMock.supabase.from.mockImplementation((table: string) => {
        if (table === "listings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [mockListing], error: null }),
              }),
            }),
          };
        }
        if (table === "datasets") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const result = await listingService.listEnriched();
      expect(result[0].creator_name).toBe("Unknown");
      expect(result[0].file_paths).toEqual([]);
    });

    it("throws when profiles fetch fails", async () => {
      const mockListing = {
        id: "lst_001", user_id: "usr_001", dataset_id: "ds_001",
        title: "Test", description: "", price_amount: 0, currency: "USD",
        platform_fee_bps: 0, license: "CC-BY-4.0", tags: [], published: true,
        download_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };

      supabaseMock.supabase.from.mockImplementation((table: string) => {
        if (table === "listings") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [mockListing], error: null }),
              }),
            }),
          };
        }
        if (table === "datasets") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      await expect(listingService.listEnriched()).rejects.toBeTruthy();
    });
  });

  describe("update", () => {
    it("updates specified fields and returns updated listing", async () => {
      const updatedListing = {
        id: "lst_001", user_id: "usr_001", dataset_id: "ds_001",
        title: "New Title", description: "", price_amount: 0, currency: "USD",
        platform_fee_bps: 0, license: "CC-BY-4.0", tags: [], published: true,
        download_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      supabaseMock.supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedListing, error: null }),
            }),
          }),
        }),
      });

      const result = await listingService.update("lst_001", { title: "New Title" });
      expect(result.title).toBe("New Title");
    });

    it("sets updated_at when updating", async () => {
      const updatedListing = {
        id: "lst_001", user_id: "usr_001", dataset_id: "ds_001",
        title: "New Title", description: "", price_amount: 0, currency: "USD",
        platform_fee_bps: 0, license: "CC-BY-4.0", tags: [], published: true,
        download_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      const updateFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updatedListing, error: null }),
          }),
        }),
      });
      supabaseMock.supabase.from.mockReturnValue({ update: updateFn });

      await listingService.update("lst_001", { title: "New Title" });
      expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ updated_at: expect.any(String) }));
    });
  });

  describe("unpublish", () => {
    it("sets published: false on the target listing", async () => {
      const updateFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      supabaseMock.supabase.from.mockReturnValue({ update: updateFn });

      await listingService.unpublish("lst_001");
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ published: false, updated_at: expect.any(String) })
      );
    });

    it("throws when Supabase returns error", async () => {
      supabaseMock.supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "Failed" } }),
        }),
      });

      await expect(listingService.unpublish("lst_001")).rejects.toBeTruthy();
    });
  });
});
