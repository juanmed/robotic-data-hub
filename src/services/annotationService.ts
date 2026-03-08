export type AnnotationTarget = "session" | "stream" | "time_range";
export type AnnotationType = "text_note" | "subtitle" | "tag" | "voice_note";

export interface SessionAnnotation {
  id: string;
  session_id: string;
  stream_id?: string;
  target: AnnotationTarget;
  type: AnnotationType;
  content: string;
  time_start?: number; // seconds
  time_end?: number;   // seconds
  author: string;
  color: string;
  created_at: string;
}

const COLORS = [
  "hsl(170 100% 50%)",   // cyan
  "hsl(260 100% 65%)",   // purple
  "hsl(45 100% 55%)",    // amber
  "hsl(330 70% 60%)",    // pink
  "hsl(140 70% 50%)",    // green
  "hsl(200 80% 55%)",    // blue
];

let annotations: SessionAnnotation[] = [
  {
    id: "ann_v_001", session_id: "ses_001", stream_id: "str_002", target: "time_range", type: "text_note",
    content: "Robot approaches pallet — good approach angle", time_start: 2.5, time_end: 5.0,
    author: "Alex Chen", color: COLORS[0], created_at: "2026-02-21T10:00:00Z",
  },
  {
    id: "ann_v_002", session_id: "ses_001", target: "session", type: "tag",
    content: "high-quality", author: "Alex Chen", color: COLORS[1], created_at: "2026-02-21T10:05:00Z",
  },
  {
    id: "ann_v_003", session_id: "ses_001", stream_id: "str_003", target: "time_range", type: "subtitle",
    content: "IMU spike — possible collision event", time_start: 8.2, time_end: 9.1,
    author: "Alex Chen", color: COLORS[2], created_at: "2026-02-21T11:00:00Z",
  },
  {
    id: "ann_v_004", session_id: "ses_001", target: "time_range", type: "voice_note",
    content: "Voice note: calibration drift observed at this segment", time_start: 12.0, time_end: 14.5,
    author: "Alex Chen", color: COLORS[3], created_at: "2026-02-21T11:30:00Z",
  },
  {
    id: "ann_v_005", session_id: "ses_004", target: "session", type: "text_note",
    content: "Full kitchen dataset v2 — includes gripper force data", author: "Alex Chen",
    color: COLORS[4], created_at: "2026-01-12T09:00:00Z",
  },
];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const annotationService = {
  async listBySession(sessionId: string): Promise<SessionAnnotation[]> {
    await delay();
    return annotations.filter((a) => a.session_id === sessionId);
  },

  async create(data: Omit<SessionAnnotation, "id" | "created_at" | "color">): Promise<SessionAnnotation> {
    await delay(400);
    const annotation: SessionAnnotation = {
      ...data,
      id: `ann_v_${Date.now()}`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      created_at: new Date().toISOString(),
    };
    annotations = [annotation, ...annotations];
    return annotation;
  },

  async remove(id: string): Promise<void> {
    await delay(200);
    annotations = annotations.filter((a) => a.id !== id);
  },
};
