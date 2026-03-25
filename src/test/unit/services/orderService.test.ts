import { describe, it, expect } from "vitest";
import { orderService } from "@/services/orderService";

describe("orderService", () => {
  describe("list", () => {
    it("returns all orders", async () => {
      const orders = await orderService.list();

      expect(Array.isArray(orders)).toBe(true);
      if (orders.length > 0) {
        const order = orders[0];
        expect(order).toHaveProperty("id");
        expect(order).toHaveProperty("buyer_id");
        expect(order).toHaveProperty("listing_id");
        expect(order).toHaveProperty("amount_cents");
        expect(order).toHaveProperty("status");
      }
    });
  });

  describe("getByListing", () => {
    it("returns completed order for a specific listing", async () => {
      const orders = await orderService.list();
      if (orders.length > 0) {
        const targetListing = orders[0];
        const order = await orderService.getByListing(targetListing.listing_id);

        if (order) {
          expect(order.listing_id).toBe(targetListing.listing_id);
          expect(order.status).toBe("completed");
        }
      }
    });

    it("returns undefined if no completed order for listing", async () => {
      const order = await orderService.getByListing("lst_nonexistent");

      expect(order).toBeUndefined();
    });
  });

  describe("create", () => {
    it("creates a new order and returns it", async () => {
      const order = await orderService.create("lst_001", 9999);

      expect(order).toBeDefined();
      expect(order.id).toMatch(/^ord_/);
      expect(order.listing_id).toBe("lst_001");
      expect(order.amount_cents).toBe(9999);
      expect(order.buyer_id).toBe("usr_001");
      expect(order.status).toBe("completed");
      expect(order.created_at).toBeDefined();
    });

    it("generates unique order ids", async () => {
      const order1 = await orderService.create("lst_001", 5000);
      const order2 = await orderService.create("lst_002", 7500);

      expect(order1.id).not.toBe(order2.id);
    });

    it("stores order in list", async () => {
      const newOrder = await orderService.create("lst_test", 1000);

      const allOrders = await orderService.list();
      const found = allOrders.find((o) => o.id === newOrder.id);

      expect(found).toBeDefined();
      expect(found?.listing_id).toBe("lst_test");
      expect(found?.amount_cents).toBe(1000);
    });
  });
});
