import { mockListings } from "@/data/mockData";
import type { Listing } from "@/types";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const searchService = {
  async search(query: string): Promise<Listing[]> {
    await delay(400);
    if (!query) return mockListings;
    const q = query.toLowerCase();
    return mockListings.filter((l) => l.title.toLowerCase().includes(q) || l.tags.some((t) => t.includes(q)));
  },
};
