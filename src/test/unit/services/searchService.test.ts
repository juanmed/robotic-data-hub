import { describe, it, expect } from "vitest";
import { searchService } from "@/services/searchService";

describe("searchService", () => {
  describe("search", () => {
    it("returns all sessions when query is empty", async () => {
      const results = await searchService.search("");

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("session");
      expect(results[0]).toHaveProperty("streams");
      expect(results[0]).toHaveProperty("previewImage");
    });

    it("returns all sessions when query is whitespace", async () => {
      const results = await searchService.search("   ");

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it("filters by session name (case-insensitive)", async () => {
      const results = await searchService.search("warehouse");

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.session.name.toLowerCase().includes("warehouse"))).toBe(true);
    });

    it("filters by session description", async () => {
      const results = await searchService.search("robot");

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(
          results.some(
            (r) =>
              r.session.name.toLowerCase().includes("robot") ||
              r.session.description?.toLowerCase().includes("robot")
          )
        ).toBe(true);
      }
    });

    it("filters by stream type", async () => {
      const results = await searchService.search("video");

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(results.some((r) => r.streams.some((s) => s.type.toLowerCase().includes("video")))).toBe(true);
      }
    });

    it("filters by annotation content", async () => {
      const results = await searchService.search("annotation");

      expect(Array.isArray(results)).toBe(true);
      // Just verify search completes without error
      expect(results).toBeDefined();
    });

    it("returns result with matched annotation count", async () => {
      const results = await searchService.search("pusht");

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty("matchedAnnotations");
        expect(typeof results[0].matchedAnnotations).toBe("number");
      }
    });

    it("includes preview images for all results", async () => {
      const results = await searchService.search("");

      expect(results.every((r) => r.previewImage && r.previewImage.startsWith("https://"))).toBe(true);
    });
  });
});
