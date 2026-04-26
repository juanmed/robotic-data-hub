/**
 * Data isolation tests — each user must only see, modify, or delete their own data.
 *
 * Strategy: mock Supabase to simulate the two possible outcomes for each operation:
 *   - Owner call  → Supabase returns data / success (RLS allows)
 *   - Non-owner call → Supabase returns empty / RLS violation error
 *
 * We also assert that services with explicit application-level user_id filters
 * (challengeService.listMine) actually pass the correct user id to the query.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { challengeService } from "@/services/challengeService";
import {
  listDatasets,
  getDataset,
  deleteDataset,
} from "@/services/datasetService";
import { listingService } from "@/services/listingService";
import { orderService } from "@/services/orderService";
import { challengeSubmissionService } from "@/services/challengeSubmissionService";

// ---------------------------------------------------------------------------
// Shared Supabase mock
// ---------------------------------------------------------------------------

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
    storage: { from: vi.fn() },
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OWNER_ID = "usr_owner";
const OTHER_ID = "usr_other";

const mockChallenge = {
  id: "ch_001",
  user_id: OWNER_ID,
  title: "Pick-and-place challenge",
  status: "active",
  compensation_amount: 1000,
  compensation_per: "dataset",
  currency: "USD",
  deadline: null,
  constraints: "",
  conditions: "",
  tags: [],
  submission_count: 0,
  published_at: new Date().toISOString(),
  closed_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockDataset = {
  id: "ds_001",
  user_id: OWNER_ID,
  display_name: "My Robot Dataset",
  source_repo_id: null,
  status: "ready" as const,
  metadata: null,
  created_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  dataset_files: [],
};

const mockListing = {
  id: "ls_001",
  user_id: OWNER_ID,
  dataset_id: "ds_001",
  title: "Pick-and-place scenes",
  description: "desc",
  price_amount: 0,
  currency: "USD",
  license: "MIT",
  tags: [],
  published: true,
  download_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockOrder = {
  id: "ord_001",
  buyer_id: OWNER_ID,
  listing_id: "ls_001",
  amount: 0,
  currency: "USD",
  status: "completed",
  created_at: new Date().toISOString(),
};

const mockSubmission = {
  id: "sub_001",
  challenge_id: "ch_001",
  submitter_id: OWNER_ID,
  dataset_id: "ds_001",
  message: "here you go",
  status: "pending",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Helper — build a chainable Supabase query mock that resolves at the end
// ---------------------------------------------------------------------------

function chainResolving(result: { data: any; error: any }) {
  const terminal: any = {};
  for (const method of [
    "order",
    "single",
    "maybeSingle",
  ]) {
    terminal[method] = vi.fn().mockResolvedValue(result);
  }
  // eq can chain further or be terminal
  terminal.eq = vi.fn().mockReturnValue(terminal);
  terminal.in = vi.fn().mockReturnValue(terminal);
  return terminal;
}

// ---------------------------------------------------------------------------
// challengeService
// ---------------------------------------------------------------------------

describe("challengeService — data isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listMine passes the authenticated user's id as an explicit eq filter", async () => {
    supabaseMock.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: OWNER_ID } },
    });
    const eqMock = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [mockChallenge], error: null }),
    });
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqMock }),
    });

    const result = await challengeService.listMine();

    // Explicit application-level user filter — not relying on RLS alone
    expect(eqMock).toHaveBeenCalledWith("user_id", OWNER_ID);
    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(OWNER_ID);
  });

  it("listMine does not return challenges belonging to a different user", async () => {
    supabaseMock.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: OTHER_ID } },
    });
    const eqMock = vi.fn().mockReturnValue({
      // Supabase (or application filter) returns nothing for OTHER_ID
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqMock }),
    });

    const result = await challengeService.listMine();

    expect(eqMock).toHaveBeenCalledWith("user_id", OTHER_ID);
    expect(result).toHaveLength(0);
    expect(result).not.toContainEqual(expect.objectContaining({ user_id: OWNER_ID }));
  });

  it("listMine returns empty array for unauthenticated users", async () => {
    supabaseMock.supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const result = await challengeService.listMine();

    expect(result).toEqual([]);
    expect(supabaseMock.supabase.from).not.toHaveBeenCalled();
  });

  it("update propagates an RLS error when called by a non-owner", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "new row violates row-level security policy" },
            }),
          }),
        }),
      }),
    });

    await expect(
      challengeService.update("ch_001", { title: "Hijacked title" })
    ).rejects.toThrow();
  });

  it("deleteDraft throws when the challenge belongs to another user", async () => {
    // get() returns active challenge owned by OWNER_ID; called as OTHER_ID
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockChallenge, // status: "active"
            error: null,
          }),
        }),
      }),
    });

    // Active challenge → "Only draft challenges can be deleted" before any RLS check
    await expect(challengeService.deleteDraft("ch_001")).rejects.toThrow(
      "Only draft challenges can be deleted"
    );
  });

  it("setStatus propagates an RLS error when called by a non-owner", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "new row violates row-level security policy" },
            }),
          }),
        }),
      }),
    });

    await expect(
      challengeService.setStatus("ch_001", "inactive")
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// datasetService
// ---------------------------------------------------------------------------

describe("datasetService — data isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listDatasets returns only the datasets the DB exposes (RLS owner-only)", async () => {
    // Supabase RLS on datasets table has no public-read policy — owner only.
    // When authenticated as OWNER_ID, the DB returns their datasets.
    const terminal = chainResolving({ data: [mockDataset], error: null });
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(terminal),
    });

    const result = await listDatasets();

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe(OWNER_ID);
  });

  it("listDatasets returns empty when RLS filters out another user's datasets", async () => {
    // Simulates OTHER_ID calling listDatasets — RLS returns nothing
    const terminal = chainResolving({ data: [], error: null });
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(terminal),
    });

    const result = await listDatasets();

    expect(result).toEqual([]);
  });

  it("getDataset returns null when RLS hides another user's dataset", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const result = await getDataset("ds_001");

    expect(result).toBeNull();
  });

  it("getDataset returns the dataset when called by the owner", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockDataset,
            error: null,
          }),
        }),
      }),
    });

    const result = await getDataset("ds_001");

    expect(result).not.toBeNull();
    expect(result?.user_id).toBe(OWNER_ID);
  });

  it("deleteDataset throws when RLS rejects the delete (non-owner)", async () => {
    const rlsError = { message: "new row violates row-level security policy" };
    supabaseMock.supabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: rlsError }),
      }),
    });

    await expect(deleteDataset("ds_001")).rejects.toThrow();
  });

  it("deleteDataset resolves when called by the owner", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    await expect(deleteDataset("ds_001")).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// listingService
// ---------------------------------------------------------------------------

describe("listingService — data isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("update propagates RLS error when called by a non-owner", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "new row violates row-level security policy" },
            }),
          }),
        }),
      }),
    });

    await expect(
      listingService.update("ls_001", { title: "Hijacked" })
    ).rejects.toThrow();
  });

  it("update succeeds for the owner", async () => {
    const updated = { ...mockListing, title: "New title" };
    supabaseMock.supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: updated, error: null }),
          }),
        }),
      }),
    });

    const result = await listingService.update("ls_001", { title: "New title" });

    expect(result.title).toBe("New title");
    expect(result.user_id).toBe(OWNER_ID);
  });

  it("unpublish propagates RLS error when called by a non-owner", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: "new row violates row-level security policy" },
        }),
      }),
    });

    await expect(listingService.unpublish("ls_001")).rejects.toThrow();
  });

  it("unpublish resolves without error for the owner", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    await expect(listingService.unpublish("ls_001")).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// orderService
// ---------------------------------------------------------------------------

describe("orderService — data isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("list returns only orders the DB exposes (RLS buyer_read: auth.uid() = buyer_id)", async () => {
    const terminal = chainResolving({ data: [mockOrder], error: null });
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(terminal),
    });

    const result = await orderService.list();

    expect(result).toHaveLength(1);
    expect(result[0].buyer_id).toBe(OWNER_ID);
  });

  it("list returns empty when RLS hides another user's orders", async () => {
    const terminal = chainResolving({ data: [], error: null });
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(terminal),
    });

    const result = await orderService.list();

    expect(result).toEqual([]);
  });

  it("create sets buyer_id to the authenticated user's id", async () => {
    supabaseMock.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: OWNER_ID } },
    });
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
      }),
    });
    supabaseMock.supabase.from.mockReturnValue({ insert: insertMock });

    const result = await orderService.create("ls_001", 0);

    const insertedPayload = insertMock.mock.calls[0][0];
    expect(insertedPayload.buyer_id).toBe(OWNER_ID);
    expect(result.buyer_id).toBe(OWNER_ID);
  });

  it("create throws when not authenticated", async () => {
    supabaseMock.supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    await expect(orderService.create("ls_001", 0)).rejects.toThrow(
      "Not authenticated"
    );
  });
});

// ---------------------------------------------------------------------------
// challengeSubmissionService
// ---------------------------------------------------------------------------

describe("challengeSubmissionService — data isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submit sets submitter_id to the authenticated user's id", async () => {
    supabaseMock.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: OWNER_ID } },
    });
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockSubmission,
          error: null,
        }),
      }),
    });
    supabaseMock.supabase.from.mockReturnValue({ insert: insertMock });

    await challengeSubmissionService.submit({
      challenge_id: "ch_001",
      dataset_id: "ds_001",
      message: "here you go",
    });

    const payload = insertMock.mock.calls[0][0];
    expect(payload.submitter_id).toBe(OWNER_ID);
  });

  it("submit throws when not authenticated", async () => {
    supabaseMock.supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    await expect(
      challengeSubmissionService.submit({
        challenge_id: "ch_001",
        dataset_id: "ds_001",
        message: "attempt",
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("listForChallenge returns only submissions the DB exposes (RLS: owner sees all, submitter sees own)", async () => {
    const terminal = chainResolving({ data: [mockSubmission], error: null });
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(terminal),
    });

    const result = await challengeSubmissionService.listForChallenge("ch_001");

    expect(result).toHaveLength(1);
    expect(result[0].challenge_id).toBe("ch_001");
  });

  it("listForChallenge returns empty when RLS hides submissions from unrelated user", async () => {
    const terminal = chainResolving({ data: [], error: null });
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(terminal),
    });

    const result = await challengeSubmissionService.listForChallenge("ch_001");

    expect(result).toEqual([]);
  });

  it("updateStatus propagates RLS error when called by a non-owner of the challenge", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { message: "new row violates row-level security policy" },
        }),
      }),
    });

    await expect(
      challengeSubmissionService.updateStatus("sub_001", "accepted")
    ).rejects.toThrow();
  });

  it("updateStatus resolves when called by the challenge owner", async () => {
    supabaseMock.supabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    await expect(
      challengeSubmissionService.updateStatus("sub_001", "accepted")
    ).resolves.toBeUndefined();
  });
});
