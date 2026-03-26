import { describe, it, expect, beforeEach, vi } from "vitest";
import { orderService } from "@/services/orderService";

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

describe("orderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock all possible from().select().* chains with main's schema (amount, currency, not amount_cents)
    supabaseMock.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    });
  });

  describe("list", () => {
    it("returns an array of orders", async () => {
      const orders = await orderService.list();
      expect(Array.isArray(orders)).toBe(true);
    });
  });

  describe("getByListing", () => {
    it("returns undefined if no completed order for listing", async () => {
      const order = await orderService.getByListing("00000000-0000-0000-0000-000000000000");
      expect(order).toBeUndefined();
    });
  });
});
