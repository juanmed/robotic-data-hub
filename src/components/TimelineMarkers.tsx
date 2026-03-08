import type { SessionAnnotation } from "@/services/annotationService";

interface TimelineMarkersProps {
  annotations: SessionAnnotation[];
  totalDuration: number; // seconds
}

/**
 * Assign each annotation a "row" so overlapping time ranges stack vertically.
 * Simple greedy interval scheduling.
 */
function assignRows(anns: SessionAnnotation[]): { ann: SessionAnnotation; row: number }[] {
  const items = (anns || [])
    .filter((a) => a.target === "time_range" && a.time_start !== undefined)
    .sort((a, b) => (a.time_start ?? 0) - (b.time_start ?? 0));

  const rowEnds: number[] = []; // tracks the end-time of each row

  return items.map((ann) => {
    const start = ann.time_start ?? 0;
    // find first row where this annotation doesn't overlap
    let row = rowEnds.findIndex((end) => end <= start);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(0);
    }
    rowEnds[row] = ann.time_end ?? start + 0.5;
    return { ann, row };
  });
}

const ROW_HEIGHT = 24; // px per row
const PADDING_Y = 4;

const TimelineMarkers = ({ annotations, totalDuration }: TimelineMarkersProps) => {
  if (totalDuration <= 0) return null;

  const placed = assignRows(annotations);
  const rowCount = placed.length > 0 ? Math.max(...placed.map((p) => p.row)) + 1 : 1;
  const trackHeight = rowCount * ROW_HEIGHT + PADDING_Y * 2;

  return (
    <div
      className="relative rounded-xl border border-border/30 bg-background/30 overflow-hidden transition-all duration-300"
      style={{ height: trackHeight }}
    >
      {/* Track background gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--primary)/0.03),transparent_50%,hsl(var(--secondary)/0.03))]" />

      {/* Quarter marks */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <div
          key={frac}
          className="absolute top-0 bottom-0 w-px bg-border/20"
          style={{ left: `${frac * 100}%` }}
        />
      ))}

      {/* Annotation strips */}
      {placed.map(({ ann, row }) => {
        const start = ann.time_start ?? 0;
        const end = ann.time_end ?? start + 0.5;
        const left = (start / totalDuration) * 100;
        const width = ((end - start) / totalDuration) * 100;
        const top = PADDING_Y + row * ROW_HEIGHT + 2;

        return (
          <div
            key={ann.id}
            className="absolute rounded-md cursor-pointer group/marker transition-all hover:brightness-125"
            style={{
              left: `${Math.min(left, 99)}%`,
              width: `${Math.max(width, 0.5)}%`,
              top,
              height: ROW_HEIGHT - 4,
              backgroundColor: ann.color.replace(')', ' / 0.2)').replace('hsl(', 'hsl('),
              borderLeft: `2px solid ${ann.color}`,
              boxShadow: `0 0 8px ${ann.color.replace(')', ' / 0.25)')}`,
            }}
            title={`${ann.content} (${start.toFixed(1)}s → ${end.toFixed(1)}s)`}
          >
            {/* Glow dot at start */}
            <div
              className="absolute -top-0.5 -left-[3px] h-2 w-2 rounded-full"
              style={{
                backgroundColor: ann.color,
                boxShadow: `0 0 6px ${ann.color.replace(')', ' / 0.8)')}`,
              }}
            />
            {/* Label inside strip if wide enough */}
            <span
              className="absolute inset-0 flex items-center px-1.5 text-[8px] font-medium truncate pointer-events-none"
              style={{ color: ann.color }}
            >
              {ann.content}
            </span>
          </div>
        );
      })}

      {/* Time labels */}
      <div className="absolute bottom-0 left-2 text-[8px] text-muted-foreground font-mono-code">0s</div>
      <div className="absolute bottom-0 right-2 text-[8px] text-muted-foreground font-mono-code">{totalDuration}s</div>
    </div>
  );
};

export default TimelineMarkers;
