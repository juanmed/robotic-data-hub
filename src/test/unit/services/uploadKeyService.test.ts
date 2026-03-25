import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createUploadKey, listUploadKeys, revokeUploadKey } from "@/services/uploadKeyService";

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

function createSelectQuery(data: any[]) {
  const query: any = {};
  query.order = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.then = (resolve: any) => Promise.resolve(resolve({ data, error: null }));
  return query;
}

describe("uploadKeyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.spyOn(globalThis.crypto.subtle, "digest").mockResolvedValue(new Uint8Array(32).buffer);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("maps active and revoked upload keys", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table !== "upload_keys") throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => createSelectQuery([
          {
            id: "key_1",
            user_id: "usr_1",
            name: "Active Key",
            key_prefix: "gpai_upl_abc****",
            created_at: "2026-03-01T00:00:00Z",
            last_used_at: null,
            revoked_at: null,
          },
          {
            id: "key_2",
            user_id: "usr_1",
            name: "Revoked Key",
            key_prefix: "gpai_upl_def****",
            created_at: "2026-03-01T00:00:00Z",
            last_used_at: "2026-03-02T00:00:00Z",
            revoked_at: "2026-03-03T00:00:00Z",
          },
        ])),
      };
    });

    await expect(listUploadKeys()).resolves.toEqual([
      expect.objectContaining({
        id: "key_1",
        active: true,
        revoked_at: null,
      }),
      expect.objectContaining({
        id: "key_2",
        active: false,
        revoked_at: "2026-03-03T00:00:00Z",
      }),
    ]);
  });

  it("creates an upload key for the current user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "usr_123",
        },
      },
      error: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table !== "upload_keys") throw new Error(`Unexpected table: ${table}`);
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: "key_1",
                user_id: "usr_123",
                name: "CLI Key",
                key_prefix: "gpai_upl_aaa****",
                created_at: "2026-03-25T00:00:00Z",
              },
              error: null,
            })),
          })),
        })),
      };
    });

    const result = await createUploadKey("CLI Key");

    expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    expect(mockSupabase.from).toHaveBeenCalledWith("upload_keys");
    expect(result.rawKey).toBe("gpai_upl_".padEnd(41, "a"));
    expect(result.key).toEqual(
      expect.objectContaining({
        id: "key_1",
        user_id: "usr_123",
        name: "CLI Key",
        active: true,
      })
    );
  });

  it("rejects unauthenticated upload key creation", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(createUploadKey("CLI Key")).rejects.toThrow("Not authenticated");
  });

  it("revokes upload keys", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table !== "upload_keys") throw new Error(`Unexpected table: ${table}`);
      return {
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: {}, error: null })),
        })),
      };
    });

    await expect(revokeUploadKey("key_1")).resolves.toBeUndefined();
    expect(mockSupabase.from).toHaveBeenCalledWith("upload_keys");
  });
});
