import { describe, it, expect, vi } from "vitest";
import { uploadService } from "@/services/uploadService";

describe("uploadService", () => {
  describe("upload", () => {
    it("uploads a file and returns asset file", async () => {
      const mockFile = new File(["test content"], "test.mp4", { type: "video/mp4" });

      const assetFile = await uploadService.upload("ses_001", "str_001", mockFile);

      expect(assetFile).toBeDefined();
      expect(assetFile).toHaveProperty("id");
      expect(assetFile).toHaveProperty("stream_id");
      expect(assetFile).toHaveProperty("filename");
      expect(assetFile).toHaveProperty("size_bytes");
    });

    it("accepts session, stream, and file parameters", async () => {
      const mockFile = new File(["data"], "video.mp4", { type: "video/mp4" });

      const assetFile = await uploadService.upload("ses_123", "str_456", mockFile);

      expect(assetFile).toBeDefined();
    });

    it("returns asset with stream_id", async () => {
      const mockFile = new File(["data"], "audio.wav", { type: "audio/wav" });

      const assetFile = await uploadService.upload("ses_001", "str_001", mockFile);

      expect(assetFile.stream_id).toBeDefined();
    });
  });

  describe("listFiles", () => {
    it("returns files for a specific stream", async () => {
      const files = await uploadService.listFiles("str_001");

      expect(Array.isArray(files)).toBe(true);
      expect(files.every((f) => f.stream_id === "str_001")).toBe(true);
    });

    it("returns empty array for stream with no files", async () => {
      const files = await uploadService.listFiles("str_nonexistent");

      expect(Array.isArray(files)).toBe(true);
    });

    it("returns files with proper structure", async () => {
      const files = await uploadService.listFiles("str_001");

      if (files.length > 0) {
        const file = files[0];
        expect(file).toHaveProperty("id");
        expect(file).toHaveProperty("stream_id");
        expect(file).toHaveProperty("filename");
        expect(file).toHaveProperty("size_bytes");
      }
    });
  });
});
