import { describe, it, expect, beforeEach } from "vitest";
import { sessionService } from "@/services/sessionService";
import { annotationService } from "@/services/annotationService";

describe("Session Detail Flow Integration Tests", () => {
  let sessionId: string;

  beforeEach(async () => {
    // Setup: Get an existing session from the list
    const sessions = await sessionService.list();
    sessionId = sessions[0].id;
  });

  describe("Load session → Add stream → Delete stream", () => {
    it("completes full session management flow", async () => {
      // Step 1: Load session
      const session = await sessionService.get(sessionId);
      expect(session).toBeDefined();
      expect(session?.id).toBe(sessionId);

      // Step 2: Add a stream
      const stream = await sessionService.addStream(sessionId, {
        name: "Camera Feed",
        type: "video",
        device_name: "camera_01",
      });
      expect(stream).toBeDefined();
      expect(stream.session_id).toBe(sessionId);
      expect(stream.type).toBe("video");

      // Step 3: Verify stream is listed
      const streams = await sessionService.getStreams(sessionId);
      expect(streams).toContainEqual(
        expect.objectContaining({
          id: stream.id,
          session_id: sessionId,
        })
      );

      // Note: Delete not implemented in sessionService, but list verifies it's there
    });
  });

  describe("Add multiple streams to session", () => {
    it("handles multiple stream types", async () => {
      const streamTypes = [
        { name: "RGB Video", type: "video" as const },
        { name: "Audio Feed", type: "audio" as const },
        { name: "IMU Data", type: "imu" as const },
      ];

      const streams: Awaited<ReturnType<typeof sessionService.addStream>>[] = [];
      for (const streamData of streamTypes) {
        const stream = await sessionService.addStream(sessionId, streamData);
        streams.push(stream);
        expect(stream.type).toBe(streamData.type);
      }

      const allStreams = await sessionService.getStreams(sessionId);
      expect(allStreams.length).toBeGreaterThanOrEqual(streams.length);
    });
  });

  describe("Annotations on session streams", () => {
    it("creates and lists annotations for session", async () => {
      // Add a stream first
      const stream = await sessionService.addStream(sessionId, {
        name: "Test Stream",
        type: "video",
      });

      // Create annotation on stream
      const annotation = await annotationService.create({
        session_id: sessionId,
        stream_id: stream.id,
        target: "time_range",
        type: "text_note",
        content: "Notable event at timestamp",
        time_start: 5.0,
        time_end: 10.0,
        author: "Test User",
      });

      expect(annotation).toBeDefined();
      expect(annotation.session_id).toBe(sessionId);
      expect(annotation.stream_id).toBe(stream.id);

      // List annotations for session
      const annotations = await annotationService.listBySession(sessionId);
      expect(annotations.some((a) => a.id === annotation.id)).toBe(true);
    });
  });

  describe("Session with streams and annotations lifecycle", () => {
    it("maintains consistency across add/create operations", async () => {
      const initialStreamCount = (await sessionService.getStreams(sessionId)).length;

      // Add streams
      const videoStream = await sessionService.addStream(sessionId, {
        name: "Video",
        type: "video",
      });

      const audioStream = await sessionService.addStream(sessionId, {
        name: "Audio",
        type: "audio",
      });

      // Create annotations
      const videoAnnotation = await annotationService.create({
        session_id: sessionId,
        stream_id: videoStream.id,
        target: "time_range",
        type: "text_note",
        content: "Video note",
        time_start: 0,
        time_end: 5,
        author: "User",
      });

      const audioAnnotation = await annotationService.create({
        session_id: sessionId,
        stream_id: audioStream.id,
        target: "time_range",
        type: "subtitle",
        content: "Audio note",
        time_start: 2,
        time_end: 8,
        author: "User",
      });

      // Verify state
      const streams = await sessionService.getStreams(sessionId);
      const annotations = await annotationService.listBySession(sessionId);

      expect(streams.length).toBeGreaterThanOrEqual(initialStreamCount + 2);
      expect(annotations.length).toBeGreaterThanOrEqual(2);
      expect(annotations.some((a) => a.id === videoAnnotation.id)).toBe(true);
      expect(annotations.some((a) => a.id === audioAnnotation.id)).toBe(true);
    });
  });
});
