import { mockApiKeys } from "@/data/mockData";
import type { APIKey } from "@/types";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const apiKeyService = {
  async list(): Promise<APIKey[]> {
    await delay();
    return mockApiKeys;
  },
  async create(name: string): Promise<APIKey> {
    await delay(500);
    return { id: `key_${Date.now()}`, user_id: "usr_001", name, key_prefix: "gai_", created_at: new Date().toISOString() };
  },
  async revoke(_id: string): Promise<void> {
    await delay();
  },
};
