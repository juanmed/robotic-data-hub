import { describe, it, expect } from "vitest";
import { searchService } from "@/services/searchService";
import { listingService } from "@/services/listingService";
import { orderService } from "@/services/orderService";

describe("Marketplace Flow Integration Tests", () => {
  describe("Search → View Listing → Purchase", () => {
    it("completes marketplace transaction flow", async () => {
      // Step 1: Search for datasets
      const searchResults = await searchService.search("pusht");
      expect(Array.isArray(searchResults)).toBe(true);

      // Step 2: Get available listings
      const listings = await listingService.list();
      expect(Array.isArray(listings)).toBe(true);

      if (listings.length > 0) {
        // Step 3: Get specific listing details
        const listing = await listingService.get(listings[0].id);
        expect(listing).toBeDefined();
        expect(listing?.title).toBeDefined();

        // Step 4: Create order for listing
        const order = await orderService.create(listings[0].id, listings[0].price_cents);
        expect(order).toBeDefined();
        expect(order.listing_id).toBe(listings[0].id);
        expect(order.status).toBe("completed");
      }
    });
  });

  describe("Search with filters", () => {
    it("filters results by various criteria", async () => {
      // Empty search returns all
      const allResults = await searchService.search("");
      expect(allResults.length).toBeGreaterThan(0);

      // Query-based search
      const pushtResults = await searchService.search("pusht");
      expect(Array.isArray(pushtResults)).toBe(true);

      // Different query
      const robotResults = await searchService.search("robot");
      expect(Array.isArray(robotResults)).toBe(true);
    });
  });

  describe("Listing publication and discovery", () => {
    it("publishes listing with correct properties", async () => {
      // Publish a new listing
      const newListing = await listingService.publish("ses_001", {
        title: "Premium Robot Dataset",
        description: "High-quality manipulation data",
        price_cents: 15000,
        tags: ["robot", "manipulation", "vision"],
      });

      expect(newListing).toBeDefined();
      expect(newListing.published).toBe(true);
      expect(newListing.title).toBe("Premium Robot Dataset");
      expect(newListing.description).toBe("High-quality manipulation data");
      expect(newListing.price_cents).toBe(15000);
      expect(newListing.tags).toEqual(["robot", "manipulation", "vision"]);
    });
  });

  describe("Order management", () => {
    it("lists and filters orders by listing", async () => {
      // Get initial orders
      const initialOrders = await orderService.list();
      const initialCount = initialOrders.length;

      // Create a new order
      const newOrder = await orderService.create("lst_test_123", 5000);
      expect(newOrder).toBeDefined();

      // Verify order is in list
      const allOrders = await orderService.list();
      expect(allOrders.length).toBeGreaterThanOrEqual(initialCount + 1);

      // Get order by listing
      const byListing = await orderService.getByListing("lst_test_123");
      expect(byListing).toBeDefined();
      expect(byListing?.listing_id).toBe("lst_test_123");
    });
  });

  describe("Complete marketplace workflow", () => {
    it("handles search → publish → order sequence", async () => {
      // Step 1: Search for existing data
      const searchResults = await searchService.search("kitchen");
      expect(Array.isArray(searchResults)).toBe(true);

      // Step 2: Publish a new listing
      const listing = await listingService.publish("ses_004", {
        title: "New Kitchen Dataset",
        description: "Fresh manipulation data",
        price_cents: 10000,
        tags: ["kitchen", "manipulation"],
      });

      // Step 3: Verify listing properties
      expect(listing).toBeDefined();
      expect(listing.id).toMatch(/^lst_/);
      expect(listing.title).toBe("New Kitchen Dataset");

      // Step 4: Create order
      const order = await orderService.create(listing.id, listing.price_cents);
      expect(order.listing_id).toBe(listing.id);
      expect(order.amount_cents).toBe(listing.price_cents);

      // Step 5: Verify order exists
      const foundOrder = await orderService.getByListing(listing.id);
      expect(foundOrder?.id).toBe(order.id);
    });
  });
});
