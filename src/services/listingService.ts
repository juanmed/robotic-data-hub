import { mockListings } from "@/data/mockData";
import type { Listing } from "@/types";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const listingService = {
  async list(): Promise<Listing[]> {
    await delay();
    return mockListings;
  },
  async get(id: string): Promise<Listing | undefined> {
    await delay();
    return mockListings.find((l) => l.id === id);
  },
  async publish(_sessionId: string, data: Partial<Listing>): Promise<Listing> {
    await delay(500);
    return { id: `lst_${Date.now()}`, user_id: "usr_001", session_id: _sessionId, title: data.title || "", description: data.description || "", price_cents: data.price_cents || 0, tags: data.tags || [], download_count: 0, published: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  },
};
