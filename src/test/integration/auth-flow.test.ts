import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "@/services/authService";
import { sessionService } from "@/services/sessionService";
import { createMockSupabaseClient } from "@/test/helpers/supabase-mock";

// Mock the supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: createMockSupabaseClient(),
}));

describe("Auth Flow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Login → Session Hydrate → Logout", () => {
    it("completes full authentication flow", async () => {
      // Step 1: Login
      const user = await authService.login("test@example.com", "password");
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();

      // Step 2: Fetch sessions (simulating session hydration)
      const sessions = await sessionService.list();
      expect(Array.isArray(sessions)).toBe(true);

      // Step 3: Get a specific session
      if (sessions.length > 0) {
        const session = await sessionService.get(sessions[0].id);
        expect(session).toBeDefined();
      }

      // Step 4: Logout
      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });

  describe("Login with invalid credentials", () => {
    it("still returns a user (mock service)", async () => {
      const user = await authService.login("wrong@example.com", "wrongpass");
      expect(user).toBeDefined();
    });
  });

  describe("Session creation after login", () => {
    it("creates a new session while logged in", async () => {
      await authService.login("test@example.com", "password");

      const newSession = await sessionService.create({
        name: "New Session",
        description: "Created after login",
      });

      expect(newSession).toBeDefined();
      expect(newSession.id).toMatch(/^ses_/);
      expect(newSession.name).toBe("New Session");
    });
  });

  describe("Register and login flow", () => {
    it("registers new user and can be retrieved", async () => {
      const newUser = await authService.register("newuser@example.com", "password", "New User");
      expect(newUser.id).toMatch(/^usr_/);

      const currentUser = await authService.getCurrentUser();
      expect(currentUser).toBeDefined();
    });
  });
});
