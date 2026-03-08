import { mockOrders } from "@/data/mockData";
import type { Order } from "@/types";

let orders = [...mockOrders];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const orderService = {
  async list(): Promise<Order[]> {
    await delay();
    return orders;
  },

  async getByListing(listingId: string): Promise<Order | undefined> {
    await delay(100);
    return orders.find((o) => o.listing_id === listingId && o.status === "completed");
  },

  async create(listingId: string, amountCents: number): Promise<Order> {
    await delay(800);
    const order: Order = {
      id: `ord_${Date.now()}`,
      buyer_id: "usr_001",
      listing_id: listingId,
      amount_cents: amountCents,
      status: "completed",
      created_at: new Date().toISOString(),
    };
    orders.push(order);
    return order;
  },
};
