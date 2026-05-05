import { beforeEach, describe, expect, it, vi } from "vitest";
import { userProfileService } from "@/services/userProfileService";

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

describe("userProfileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches public profile", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "usr_1",
              display_name: "alice",
              avatar_url: null,
              member_since: "2026-01-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      }),
    });

    const result = await userProfileService.getPublicProfile("usr_1");
    expect(result?.display_name).toBe("alice");
  });

  it("returns null when profile missing", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const result = await userProfileService.getPublicProfile("usr_missing");
    expect(result).toBeNull();
  });

  it("fetches stats via rpc", async () => {
    supabaseMock.supabase.rpc.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          total_challenges_created: 4,
          total_successful_participations: 2,
          total_datasets_uploaded: 7,
        },
        error: null,
      }),
    });

    const result = await userProfileService.getProfileStats("usr_1");
    expect(result.total_challenges_created).toBe(4);
    expect(result.total_successful_participations).toBe(2);
    expect(result.total_datasets_uploaded).toBe(7);
  });

  it("queries active challenges by user", async () => {
    const rangeMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock });
    const statusEqMock = vi.fn().mockReturnValue({ order: orderMock });
    const userEqMock = vi.fn().mockReturnValue({ eq: statusEqMock });

    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: userEqMock,
      }),
    });

    await userProfileService.listPublicChallengesByUser("usr_1", 2, 10);

    expect(userEqMock).toHaveBeenCalledWith("user_id", "usr_1");
    expect(statusEqMock).toHaveBeenCalledWith("status", "active");
    expect(rangeMock).toHaveBeenCalledWith(10, 19);
  });
});
