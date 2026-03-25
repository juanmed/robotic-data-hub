import { describe, it, expect, beforeEach } from "vitest";
import { annotationService } from "@/services/annotationService";

describe("annotationService", () => {
  describe("listBySession", () => {
    it("returns annotations for a specific session", async () => {
      const annotations = await annotationService.listBySession("ses_001");
      expect(annotations).toBeDefined();
      expect(Array.isArray(annotations)).toBe(true);
      expect(annotations.every((a) => a.session_id === "ses_001")).toBe(true);
    });

    it("returns empty array for session with no annotations", async () => {
      const annotations = await annotationService.listBySession("ses_nonexistent");
      expect(annotations).toEqual([]);
    });
  });

  describe("create", () => {
    it("creates a new annotation with auto-generated id and color", async () => {
      const data = {
        session_id: "ses_001",
        stream_id: "str_001",
        target: "time_range" as const,
        type: "text_note" as const,
        content: "Test annotation",
        time_start: 1.0,
        time_end: 2.0,
        author: "Test User",
      };

      const annotation = await annotationService.create(data);

      expect(annotation).toMatchObject(data);
      expect(annotation.id).toMatch(/^ann_v_/);
      expect(annotation.color).toBeDefined();
      expect(annotation.created_at).toBeDefined();
    });

    it("creates annotation without optional fields", async () => {
      const data = {
        session_id: "ses_002",
        target: "session" as const,
        type: "tag" as const,
        content: "high-quality",
        author: "Test User",
      };

      const annotation = await annotationService.create(data);

      expect(annotation.session_id).toBe("ses_002");
      expect(annotation.stream_id).toBeUndefined();
      expect(annotation.time_start).toBeUndefined();
    });
  });

  describe("remove", () => {
    it("removes an annotation by id", async () => {
      const data = {
        session_id: "ses_001",
        target: "session" as const,
        type: "text_note" as const,
        content: "To be deleted",
        author: "Test User",
      };

      const created = await annotationService.create(data);
      const annotationsBefore = await annotationService.listBySession("ses_001");
      const idExists = annotationsBefore.some((a) => a.id === created.id);
      expect(idExists).toBe(true);

      await annotationService.remove(created.id);

      const annotationsAfter = await annotationService.listBySession("ses_001");
      const idExistsAfter = annotationsAfter.some((a) => a.id === created.id);
      expect(idExistsAfter).toBe(false);
    });

    it("handles removing non-existent annotation gracefully", async () => {
      await expect(annotationService.remove("nonexistent")).resolves.toBeUndefined();
    });
  });
});
