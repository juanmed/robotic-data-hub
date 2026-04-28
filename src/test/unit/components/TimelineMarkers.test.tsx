import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TimelineMarkers from "@/components/TimelineMarkers";
import type { SessionAnnotation } from "@/services/annotationService";

const makeAnnotation = (overrides: Partial<SessionAnnotation> = {}): SessionAnnotation => ({
  id: "ann_001",
  session_id: "ses_001",
  target: "time_range",
  type: "text_note",
  content: "Test annotation",
  time_start: 0,
  time_end: 5,
  author: "tester",
  color: "hsl(170 100% 50%)",
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("TimelineMarkers", () => {
  it("returns null when totalDuration is 0", () => {
    const { container } = render(
      <TimelineMarkers annotations={[makeAnnotation()]} totalDuration={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when totalDuration is negative", () => {
    const { container } = render(
      <TimelineMarkers annotations={[makeAnnotation()]} totalDuration={-10} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders time labels for start and end", () => {
    render(<TimelineMarkers annotations={[]} totalDuration={60} />);
    expect(screen.getByText("0s")).toBeInTheDocument();
    expect(screen.getByText("60s")).toBeInTheDocument();
  });

  it("renders quarter-mark grid lines", () => {
    const { container } = render(
      <TimelineMarkers annotations={[]} totalDuration={100} />
    );
    const gridLines = container.querySelectorAll(".w-px.bg-border\\/20");
    expect(gridLines.length).toBe(3);
  });

  it("renders annotation strip with correct title", () => {
    const ann = makeAnnotation({ content: "Robot grabs pallet", time_start: 10, time_end: 20 });
    render(<TimelineMarkers annotations={[ann]} totalDuration={100} />);
    expect(screen.getByTitle(/Robot grabs pallet/)).toBeInTheDocument();
  });

  it("renders annotation content label inside strip", () => {
    const ann = makeAnnotation({ content: "Label text", time_start: 5, time_end: 15 });
    render(<TimelineMarkers annotations={[ann]} totalDuration={100} />);
    expect(screen.getByText("Label text")).toBeInTheDocument();
  });

  it("ignores annotations that are not target=time_range", () => {
    const sessionAnn = makeAnnotation({ target: "session", content: "Session note" });
    const streamAnn = makeAnnotation({ id: "ann_002", target: "stream", content: "Stream note" });
    render(<TimelineMarkers annotations={[sessionAnn, streamAnn]} totalDuration={100} />);
    expect(screen.queryByTitle(/Session note/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Stream note/)).not.toBeInTheDocument();
  });

  it("ignores time_range annotations without time_start", () => {
    const ann = makeAnnotation({ time_start: undefined, content: "No time" });
    render(<TimelineMarkers annotations={[ann]} totalDuration={100} />);
    expect(screen.queryByTitle(/No time/)).not.toBeInTheDocument();
  });

  it("handles empty annotations array gracefully", () => {
    render(<TimelineMarkers annotations={[]} totalDuration={60} />);
    expect(screen.getByText("0s")).toBeInTheDocument();
  });

  it("assigns separate rows to overlapping annotations", () => {
    const ann1 = makeAnnotation({ id: "a1", content: "First", time_start: 0, time_end: 10 });
    const ann2 = makeAnnotation({ id: "a2", content: "Second", time_start: 5, time_end: 15 });
    render(<TimelineMarkers annotations={[ann1, ann2]} totalDuration={20} />);
    expect(screen.getByTitle(/First/)).toBeInTheDocument();
    expect(screen.getByTitle(/Second/)).toBeInTheDocument();
  });

  it("puts non-overlapping annotations in the same row", () => {
    const ann1 = makeAnnotation({ id: "a1", content: "First", time_start: 0, time_end: 5 });
    const ann2 = makeAnnotation({ id: "a2", content: "Second", time_start: 5, time_end: 10 });
    const { container } = render(
      <TimelineMarkers annotations={[ann1, ann2]} totalDuration={20} />
    );
    const strips = container.querySelectorAll(".absolute.rounded-md.cursor-pointer");
    expect(strips.length).toBe(2);
  });

  it("handles unsorted input by sorting by time_start", () => {
    const late = makeAnnotation({ id: "a1", content: "Late", time_start: 15, time_end: 20 });
    const early = makeAnnotation({ id: "a2", content: "Early", time_start: 2, time_end: 8 });
    render(<TimelineMarkers annotations={[late, early]} totalDuration={25} />);
    expect(screen.getByTitle(/Early/)).toBeInTheDocument();
    expect(screen.getByTitle(/Late/)).toBeInTheDocument();
  });

  it("defaults time_end to time_start + 0.5 when missing", () => {
    const ann = makeAnnotation({ content: "No end", time_start: 10, time_end: undefined });
    render(<TimelineMarkers annotations={[ann]} totalDuration={100} />);
    const strip = screen.getByTitle("No end (10.0s → 10.5s)");
    expect(strip).toBeInTheDocument();
  });

  it("clamps left position to max 99% for annotations near the end", () => {
    const ann = makeAnnotation({ content: "Near end", time_start: 99.5, time_end: 100 });
    const { container } = render(
      <TimelineMarkers annotations={[ann]} totalDuration={100} />
    );
    const strip = container.querySelector(".absolute.rounded-md.cursor-pointer") as HTMLElement;
    expect(strip).toBeTruthy();
    expect(parseFloat(strip.style.left)).toBeLessThanOrEqual(99);
  });

  it("clamps width to minimum 0.5% for very short annotations", () => {
    const ann = makeAnnotation({ content: "Tiny", time_start: 50, time_end: 50.001 });
    const { container } = render(
      <TimelineMarkers annotations={[ann]} totalDuration={100} />
    );
    const strip = container.querySelector(".absolute.rounded-md.cursor-pointer") as HTMLElement;
    expect(strip).toBeTruthy();
    expect(parseFloat(strip.style.width)).toBeGreaterThanOrEqual(0.5);
  });
});
