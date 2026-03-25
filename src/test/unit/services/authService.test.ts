import { describe, it, expect } from "vitest";
import { authService } from "@/services/authService";

describe("authService", () => {
  describe("login", () => {
    it("returns a user object", async () => {
      const user = await authService.login("user@example.com", "password");

      expect(user).toBeDefined();
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("name");
    });

    it("accepts email and password parameters", async () => {
      const user = await authService.login("test@example.com", "testpass");

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
    });
  });

  describe("logout", () => {
    it("completes without error", async () => {
      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });

  describe("getCurrentUser", () => {
    it("returns current user object", async () => {
      const user = await authService.getCurrentUser();

      expect(user).toBeDefined();
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("name");
    });
  });

  describe("register", () => {
    it("creates a new user and returns user object", async () => {
      const user = await authService.register("newuser@example.com", "password", "New User");

      expect(user).toBeDefined();
      expect(user).toHaveProperty("id");
      expect(user.id).toMatch(/^usr_/);
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("name");
    });

    it("returns a user with new id prefix", async () => {
      const user = await authService.register("user1@example.com", "pass1", "User One");

      expect(user.id).toMatch(/^usr_/);
    });
  });
});
