import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const mockSupabase = vi.hoisted(() => ({
  auth: {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
  from: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSupabase.auth.onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("maps a Supabase session user and hydrates the profile", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "usr_session",
            email: "session@example.com",
            user_metadata: { full_name: "Session User", avatar_url: "https://example.com/avatar.png" },
            email_confirmed_at: "2026-03-25T00:00:00Z",
          },
        },
      },
      error: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table !== "profiles") throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: "usr_profile",
                email: "profile@example.com",
                name: "Profile User",
                email_verified: true,
              },
            })),
          })),
        })),
      };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.user?.id).toBe("usr_profile"));
    expect(result.current.user?.name).toBe("Profile User");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("ignores stale profile fetches when sessions change quickly", async () => {
    const authCallbacks: Array<(event: string, session: any) => void> = [];
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallbacks.push(callback);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const deferreds = new Map<string, Deferred<{ data: any; error: null }>>();
    mockSupabase.from.mockImplementation((table: string) => {
      if (table !== "profiles") throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_column: string, id: string) => {
            if (!deferreds.has(id)) {
              deferreds.set(id, createDeferred());
            }
            return {
              single: vi.fn(() => deferreds.get(id)!.promise),
            };
          }),
        })),
      };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const user1 = {
      id: "usr_1",
      email: "one@example.com",
      user_metadata: { full_name: "User One" },
      email_confirmed_at: "2026-03-25T00:00:00Z",
    };
    const user2 = {
      id: "usr_2",
      email: "two@example.com",
      user_metadata: { full_name: "User Two" },
      email_confirmed_at: "2026-03-25T00:00:00Z",
    };

    act(() => {
      authCallbacks[0]?.("SIGNED_IN", { user: user1 });
      authCallbacks[0]?.("SIGNED_IN", { user: user2 });
    });

    deferreds.get("usr_2")?.resolve({
      data: {
        id: "profile_2",
        email: "two@example.com",
        name: "Profile Two",
        email_verified: true,
      },
      error: null,
    });
    deferreds.get("usr_1")?.resolve({
      data: {
        id: "profile_1",
        email: "one@example.com",
        name: "Profile One",
        email_verified: true,
      },
      error: null,
    });

    await waitFor(() => expect(result.current.user?.id).toBe("profile_2"));
    expect(result.current.user?.name).toBe("Profile Two");
  });

  it("rejects unverified logins and signs out", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: "usr_login",
          email: "login@example.com",
          email_confirmed_at: null,
        },
      },
      error: null,
    });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.login("login@example.com", "password")).rejects.toThrow(
        "Please verify your email before signing in. Check your inbox for the verification link."
      );
    });
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("forwards registration metadata and redirect url", async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ data: {}, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.register("new@example.com", "secret", "New User");

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "secret",
      options: {
        data: { name: "New User" },
        emailRedirectTo: "https://gamiphy.ai/auth/callback",
      },
    });
  });

  it("logs out and clears the user state", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "usr_logout",
            email: "logout@example.com",
            user_metadata: { full_name: "Logout User" },
            email_confirmed_at: "2026-03-25T00:00:00Z",
          },
        },
      },
      error: null,
    });
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: {
              id: "usr_logout",
              email: "logout@example.com",
              name: "Logout User",
              email_verified: true,
            },
          })),
        })),
      })),
    }));
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
  });
});
