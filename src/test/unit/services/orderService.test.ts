import { describe, it, expect } from "vitest";
import { orderService } from "@/services/orderService";

describe("orderService", () => {
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
