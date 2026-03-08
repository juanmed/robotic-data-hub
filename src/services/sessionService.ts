import { mockSessions, mockStreams } from "@/data/mockData";
import type { Session, Stream } from "@/types";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const sessionService = {
  async list(): Promise<Session[]> {
    await delay();
    return mockSessions;
  },
  async get(id: string): Promise<Session | undefined> {
    await delay();
    return mockSessions.find((s) => s.id === id);
  },
  async create(data: Partial<Session>): Promise<Session> {
    await delay(500);
    return { id: `ses_${Date.now()}`, user_id: "usr_001", name: data.name || "Untitled", status: "draft", stream_count: 0, total_size_bytes: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  },
  async getStreams(sessionId: string): Promise<Stream[]> {
    await delay();
    return mockStreams.filter((s) => s.session_id === sessionId);
  },
};
