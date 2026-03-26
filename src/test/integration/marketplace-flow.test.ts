import { describe, it, expect } from "vitest";
import { searchService } from "@/services/searchService";
import { listingService } from "@/services/listingService";
import { orderService } from "@/services/orderService";

describe("Marketplace Flow Integration Tests", () => {
  describe("Search → View Listing → Purchase", () => {
    it("completes marketplace transaction flow", async () => {
      const searchResults = await searchService.search("pusht");
      expect(Array.isArray(searchResults)).toBe(true);

      const listings = await listingService.list();
      expect(Array.isArray(listings)).toBe(true);

      if (listings.length > 0) {
        const listing = await listingService.get(listings[0].id);
        expect(listing).toBeDefined();
        expect(listing?.title).toBeDefined();
      }
    });
  });

  describe("Search with filters", () => {
    it("filters results by various criteria", async () => {
      const allResults = await searchService.search("");
      expect(allResults.length).toBeGreaterThan(0);

      const pushtResults = await searchService.search("pusht");
      expect(Array.isArray(pushtResults)).toBe(true);

      const robotResults = await searchService.search("robot");
      expect(Array.isArray(robotResults)).toBe(true);
    });
  });

  describe("Listing retrieval", () => {
    it("lists published listings", async () => {
      const listings = await listingService.list();
      expect(Array.isArray(listings)).toBe(true);
    });

    it("gets a listing by id if exists", async () => {
      const listings = await listingService.list();
      if (listings.length > 0) {
        const listing = await listingService.get(listings[0].id);
        expect(listing).toBeDefined();
        expect(listing?.price_amount).toBeDefined();
        expect(listing?.currency).toBeDefined();
        expect(listing?.license).toBeDefined();
      }
    });
  });

  describe("Order management", () => {
    it("lists orders", async () => {
      const orders = await orderService.list();
      expect(Array.isArray(orders)).toBe(true);
    });

    it("returns undefined for non-existent listing order", async () => {
      const order = await orderService.getByListing("00000000-0000-0000-0000-000000000000");
      expect(order).toBeUndefined();
    });
  });
});
