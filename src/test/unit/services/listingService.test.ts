import { describe, it, expect } from "vitest";
import { listingService } from "@/services/listingService";

describe("listingService", () => {
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
