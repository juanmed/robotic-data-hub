import { describe, it, expect } from "vitest";
import { apiKeyService } from "@/services/apiKeyService";

describe("apiKeyService", () => {
  describe("list", () => {
    it("returns all API keys", async () => {
      const keys = await apiKeyService.list();

      expect(Array.isArray(keys)).toBe(true);
      if (keys.length > 0) {
        const key = keys[0];
        expect(key).toHaveProperty("id");
        expect(key).toHaveProperty("user_id");
        expect(key).toHaveProperty("name");
        expect(key).toHaveProperty("key_prefix");
        expect(key).toHaveProperty("created_at");
      }
    });
  });

  describe("create", () => {
    it("creates a new API key", async () => {
      const key = await apiKeyService.create("My API Key");

      expect(key).toBeDefined();
      expect(key.id).toMatch(/^key_/);
      expect(key.name).toBe("My API Key");
      expect(key.user_id).toBe("usr_001");
      expect(key.key_prefix).toBeDefined();
      expect(key.created_at).toBeDefined();
    });

    it("generates unique key ids", async () => {
      const key1 = await apiKeyService.create("Key 1");
      const key2 = await apiKeyService.create("Key 2");

      expect(key1.id).not.toBe(key2.id);
    });

    it("sets key_prefix for newly created keys", async () => {
      const key = await apiKeyService.create("Prefixed Key");

      expect(key.key_prefix).toBeDefined();
      expect(typeof key.key_prefix).toBe("string");
    });
  });

  describe("revoke", () => {
    it("revokes an API key by id", async () => {
      const key = await apiKeyService.create("To Revoke");

      await expect(apiKeyService.revoke(key.id)).resolves.toBeUndefined();
    });

    it("handles revoke for non-existent key", async () => {
      await expect(apiKeyService.revoke("nonexistent")).resolves.toBeUndefined();
    });
  });
});
