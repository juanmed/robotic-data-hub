import { mockSessions, mockStreams } from "@/data/mockData";
import type { Session, Stream } from "@/types";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// Local mutable copies for session-scoped mutations
let localStreams = [...mockStreams];

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
    return {
      id: `ses_${Date.now()}`,
      user_id: "usr_001",
      name: data.name || "Untitled",
      description: data.description,
      status: "draft",
      stream_count: 0,
      total_size_bytes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
  async getStreams(sessionId: string): Promise<Stream[]> {
    await delay();
    return localStreams.filter((s) => s.session_id === sessionId);
  },
  async addStream(sessionId: string, data: { name: string; type: Stream["type"]; device_name?: string; sample_rate?: string }): Promise<Stream> {
    await delay(400);
    const formatMap: Record<string, string> = {
      video: "mp4", audio: "wav", imu: "csv", lidar: "pcd", depth: "bag", pose: "json", other: "bin",
    };
    const newStream: Stream = {
      id: `str_${Date.now()}`,
      session_id: sessionId,
      name: data.name,
      type: data.type,
      device_name: data.device_name,
      sample_rate: data.sample_rate,
      format: formatMap[data.type] || "bin",
      file_count: 0,
      files: [],
    };
    localStreams.push(newStream);
    return newStream;
  },
};
