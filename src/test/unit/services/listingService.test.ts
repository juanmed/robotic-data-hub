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
});
