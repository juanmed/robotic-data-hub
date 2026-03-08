import { mockOrders } from "@/data/mockData";
import type { Order } from "@/types";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const orderService = {
  async list(): Promise<Order[]> {
    await delay();
    return mockOrders;
  },
  async create(listingId: string): Promise<Order> {
    await delay(500);
    return { id: `ord_${Date.now()}`, buyer_id: "usr_001", listing_id: listingId, amount_cents: 4900, status: "pending", created_at: new Date().toISOString() };
  },
};
