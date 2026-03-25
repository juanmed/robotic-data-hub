import { describe, it, expect } from "vitest";
import { listingService } from "@/services/listingService";

describe("listingService", () => {
  describe("list", () => {
    it("returns all listings", async () => {
      const listings = await listingService.list();

      expect(Array.isArray(listings)).toBe(true);
      if (listings.length > 0) {
        const listing = listings[0];
        expect(listing).toHaveProperty("id");
        expect(listing).toHaveProperty("user_id");
        expect(listing).toHaveProperty("title");
        expect(listing).toHaveProperty("description");
        expect(listing).toHaveProperty("price_cents");
      }
    });
  });

  describe("get", () => {
    it("returns a specific listing by id", async () => {
      const listings = await listingService.list();
      if (listings.length > 0) {
        const targetId = listings[0].id;

        const listing = await listingService.get(targetId);

        expect(listing).toBeDefined();
        expect(listing?.id).toBe(targetId);
      }
    });

    it("returns undefined for non-existent listing", async () => {
      const listing = await listingService.get("lst_nonexistent");

      expect(listing).toBeUndefined();
    });
  });

  describe("publish", () => {
    it("publishes a new listing for a session", async () => {
      const listing = await listingService.publish("ses_001", {
        title: "Robot Training Dataset",
        description: "High-quality push-t dataset",
        price_cents: 5000,
        tags: ["robot", "manipulation"],
      });

      expect(listing).toBeDefined();
      expect(listing.id).toMatch(/^lst_/);
      expect(listing.session_id).toBe("ses_001");
      expect(listing.title).toBe("Robot Training Dataset");
      expect(listing.description).toBe("High-quality push-t dataset");
      expect(listing.price_cents).toBe(5000);
      expect(listing.tags).toEqual(["robot", "manipulation"]);
      expect(listing.published).toBe(true);
      expect(listing.user_id).toBe("usr_001");
    });

    it("uses defaults for missing fields", async () => {
      const listing = await listingService.publish("ses_002", {});

      expect(listing.title).toBe("");
      expect(listing.description).toBe("");
      expect(listing.price_cents).toBe(0);
      expect(listing.tags).toEqual([]);
    });

    it("generates unique listing ids", async () => {
      const listing1 = await listingService.publish("ses_001", { title: "First" });
      const listing2 = await listingService.publish("ses_002", { title: "Second" });

      expect(listing1.id).not.toBe(listing2.id);
    });

    it("initializes download_count to zero", async () => {
      const listing = await listingService.publish("ses_001", { title: "Test" });

      expect(listing.download_count).toBe(0);
    });

    it("sets created_at and updated_at timestamps", async () => {
      const before = new Date();
      const listing = await listingService.publish("ses_001", { title: "Test" });
      const after = new Date();

      const createdAt = new Date(listing.created_at);
      const updatedAt = new Date(listing.updated_at);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 100);
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 100);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 100);
      expect(updatedAt.getTime()).toBeLessThanOrEqual(after.getTime() + 100);
    });
  });
});
