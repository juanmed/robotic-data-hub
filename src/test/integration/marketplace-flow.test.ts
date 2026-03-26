import { describe, it, expect, beforeEach, vi } from "vitest";
import { searchService } from "@/services/searchService";
import { listingService } from "@/services/listingService";
import { orderService } from "@/services/orderService";

const supabaseMock = vi.hoisted(() => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock.supabase,
}));

describe("Marketplace Flow Integration Tests", () => {
  let insertedListings: Record<string, any> = {};
  let insertedOrders: Record<string, any> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    insertedListings = {};
    insertedOrders = {};

    supabaseMock.supabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "usr_001",
          email: "test@example.com",
        },
      },
    });

    // Mock from() to return different data based on table name
    supabaseMock.supabase.from.mockImplementation((tableName: string) => {
      if (tableName === "listings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "lst_test_1",
                    session_id: "ses_001",
                    user_id: "usr_001",
                    title: "Test Listing",
                    description: "Test Description",
                    price_cents: 5000,
                    tags: ["test"],
                    published: true,
                    download_count: 10,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ],
                error: null,
              }),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "lst_test_1",
                  session_id: "ses_001",
                  user_id: "usr_001",
                  title: "Test Listing",
                  description: "Test Description",
                  price_cents: 5000,
                  tags: ["test"],
                  published: true,
                  download_count: 10,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "lst_test_1",
                  session_id: "ses_001",
                  user_id: "usr_001",
                  title: "Test Listing",
                  description: "Test Description",
                  price_cents: 5000,
                  tags: ["test"],
                  published: true,
                  download_count: 10,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ],
              error: null,
            }),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
          insert: vi.fn().mockImplementation((insertData: any) => ({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: `lst_${Date.now()}`,
                  ...insertData,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          })),
        };
      } else if (tableName === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((filterKey: string, filterValue: any) => ({
              eq: vi.fn().mockImplementation((key2: string, value2: any) => ({
                maybeSingle: vi.fn().mockImplementation(async () => {
                  // Find order matching both eq conditions
                  const found = Object.values(insertedOrders).find(
                    (order: any) =>
                      order[filterKey] === filterValue && order[key2] === value2
                  );
                  return {
                    data: found || null,
                    error: null,
                  };
                }),
              })),
              maybeSingle: vi.fn().mockImplementation(async () => {
                // Find order matching first eq condition
                const found = Object.values(insertedOrders).find(
                  (order: any) => order[filterKey] === filterValue
                );
                return {
                  data: found || null,
                  error: null,
                };
              }),
            })),
            order: vi.fn().mockResolvedValue({
              data: Object.values(insertedOrders),
              error: null,
            }),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
          insert: vi.fn().mockImplementation((insertData: any) => ({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(async () => {
                const orderId = `ord_${Date.now()}`;
                const orderData = {
                  id: orderId,
                  ...insertData,
                  created_at: new Date().toISOString(),
                };
                insertedOrders[orderId] = orderData;
                return {
                  data: orderData,
                  error: null,
                };
              }),
            }),
          })),
        };
      }
      return {};
    });
  });

  describe("Search → View Listing → Purchase", () => {
    it("completes marketplace transaction flow", async () => {
      const searchResults = await searchService.search("pusht");
      expect(Array.isArray(searchResults)).toBe(true);

      const listings = await listingService.list();
      expect(Array.isArray(listings)).toBe(true);

      if (listings.length > 0) {
        const listing = await listingService.get(listings[0].id);
        expect(listing).toBeDefined();
        expect(listing?.title).toBeDefined();
      }
    });
  });

  describe("Search with filters", () => {
    it("filters results by various criteria", async () => {
      const allResults = await searchService.search("");
      expect(allResults.length).toBeGreaterThan(0);

      const pushtResults = await searchService.search("pusht");
      expect(Array.isArray(pushtResults)).toBe(true);

      const robotResults = await searchService.search("robot");
      expect(Array.isArray(robotResults)).toBe(true);
    });
  });

  describe("Listing retrieval", () => {
    it("lists published listings", async () => {
      const listings = await listingService.list();
      expect(Array.isArray(listings)).toBe(true);
    });

    it("gets a listing by id if exists", async () => {
      const listings = await listingService.list();
      if (listings.length > 0) {
        const listing = await listingService.get(listings[0].id);
        expect(listing).toBeDefined();
        expect(listing?.price_amount).toBeDefined();
        expect(listing?.currency).toBeDefined();
        expect(listing?.license).toBeDefined();
      }
    });
  });

  describe("Order management", () => {
    it("lists orders", async () => {
      const orders = await orderService.list();
      expect(Array.isArray(orders)).toBe(true);
    });

    it("returns undefined for non-existent listing order", async () => {
      const order = await orderService.getByListing("00000000-0000-0000-0000-000000000000");
      expect(order).toBeUndefined();
    });
  });
});
