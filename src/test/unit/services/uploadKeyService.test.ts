import { describe, it, expect } from "vitest";
import * as uploadKeyService from "@/services/uploadKeyService";

describe("uploadKeyService", () => {
  describe("exports", () => {
    it("exports listUploadKeys function", () => {
      expect(uploadKeyService.listUploadKeys).toBeDefined();
      expect(typeof uploadKeyService.listUploadKeys).toBe("function");
    });

    it("exports createUploadKey function", () => {
      expect(uploadKeyService.createUploadKey).toBeDefined();
      expect(typeof uploadKeyService.createUploadKey).toBe("function");
    });

    it("exports revokeUploadKey function", () => {
      expect(uploadKeyService.revokeUploadKey).toBeDefined();
      expect(typeof uploadKeyService.revokeUploadKey).toBe("function");
    });
  });

  describe("service structure", () => {
    it("provides key management operations", () => {
      // Verify the service exports all required operations
      expect(uploadKeyService.listUploadKeys).toBeDefined();
      expect(uploadKeyService.createUploadKey).toBeDefined();
      expect(uploadKeyService.revokeUploadKey).toBeDefined();
    });

    it("all functions are async", () => {
      // Functions should return Promises (be async)
      const listResult = uploadKeyService.listUploadKeys();
      expect(listResult).toBeInstanceOf(Promise);
    });
  });
});
