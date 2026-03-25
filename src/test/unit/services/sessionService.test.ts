import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sessionService } from "@/services/sessionService";

describe("sessionService", () => {
  describe("list", () => {
    it("returns all sessions", async () => {
      const sessions = await sessionService.list();
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0]).toHaveProperty("id");
      expect(sessions[0]).toHaveProperty("name");
    });
  });

  describe("get", () => {
    it("returns a specific session by id", async () => {
      const sessions = await sessionService.list();
      const targetSession = sessions[0];

      const session = await sessionService.get(targetSession.id);

      expect(session).toBeDefined();
      expect(session?.id).toBe(targetSession.id);
      expect(session?.name).toBe(targetSession.name);
    });

    it("returns undefined for non-existent session", async () => {
      const session = await sessionService.get("nonexistent");
      expect(session).toBeUndefined();
    });
  });

  describe("create", () => {
    it("creates a new session with provided data", async () => {
      const newSession = await sessionService.create({
        name: "Test Session",
        description: "A test session",
      });

      expect(newSession).toBeDefined();
      expect(newSession.id).toMatch(/^ses_/);
      expect(newSession.name).toBe("Test Session");
      expect(newSession.description).toBe("A test session");
      expect(newSession.status).toBe("draft");
      expect(newSession.stream_count).toBe(0);
    });

    it("creates session with default name if not provided", async () => {
      const newSession = await sessionService.create({});

      expect(newSession.name).toBe("Untitled");
    });
  });

  describe("getStreams", () => {
    it("returns streams for a specific session", async () => {
      const sessions = await sessionService.list();
      const targetSession = sessions[0];

      const streams = await sessionService.getStreams(targetSession.id);

      expect(Array.isArray(streams)).toBe(true);
      expect(streams.every((s) => s.session_id === targetSession.id)).toBe(true);
    });

    it("returns empty array for session with no streams", async () => {
      const streams = await sessionService.getStreams("nonexistent");
      expect(streams).toEqual([]);
    });
  });

  describe("addStream", () => {
    it("adds a new stream to a session", async () => {
      const sessions = await sessionService.list();
      const targetSession = sessions[0];

      const newStream = await sessionService.addStream(targetSession.id, {
        name: "Video Stream",
        type: "video",
        device_name: "camera_01",
        sample_rate: "30fps",
      });

      expect(newStream).toBeDefined();
      expect(newStream.id).toMatch(/^str_/);
      expect(newStream.session_id).toBe(targetSession.id);
      expect(newStream.name).toBe("Video Stream");
      expect(newStream.type).toBe("video");
      expect(newStream.format).toBe("mp4");
      expect(newStream.device_name).toBe("camera_01");
    });

    it("assigns correct format based on stream type", async () => {
      const sessions = await sessionService.list();
      const targetSession = sessions[0];

      const testCases = [
        { type: "audio" as const, expectedFormat: "wav" },
        { type: "imu" as const, expectedFormat: "csv" },
        { type: "lidar" as const, expectedFormat: "pcd" },
        { type: "pose" as const, expectedFormat: "json" },
      ];

      for (const testCase of testCases) {
        const stream = await sessionService.addStream(targetSession.id, {
          name: `${testCase.type} stream`,
          type: testCase.type,
        });
        expect(stream.format).toBe(testCase.expectedFormat);
      }
    });
  });
});
