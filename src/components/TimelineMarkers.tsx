import { useState, useEffect } from "react";
import { annotationService, type SessionAnnotation } from "@/services/annotationService";

interface TimelineMarkersProps {
  sessionId: string;
  totalDuration: number; // seconds
}

const TimelineMarkers = ({ sessionId, totalDuration }: TimelineMarkersProps) => {
  const [annotations, setAnnotations] = useState<SessionAnnotation[]>([]);

  useEffect(() => {
    annotationService.listBySession(sessionId).then((all) => {
      setAnnotations(all.filter((a) => a.target === "time_range" && a.time_start !== undefined));
    });
  }, [sessionId]);

  if (annotations.length === 0 || totalDuration <= 0) return null;

  return (
    <div className="relative h-8 rounded-xl border border-border/30 bg-background/30 overflow-hidden">
      {/* Track bg */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--primary)/0.03),transparent_50%,hsl(var(--secondary)/0.03))]" />

      {/* Time marks */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <div
          key={frac}
          className="absolute top-0 bottom-0 w-px bg-border/20"
          style={{ left: `${frac * 100}%` }}
        />
      ))}

      {/* Annotation markers */}
      {annotations.map((ann) => {
        if (ann.time_start === undefined) return null;
        const left = (ann.time_start / totalDuration) * 100;
        const width = ann.time_end !== undefined
          ? ((ann.time_end - ann.time_start) / totalDuration) * 100
          : 1;

        return (
          <div
            key={ann.id}
            className="absolute top-1 bottom-1 rounded-md cursor-pointer group/marker transition-all hover:brightness-125"
            style={{
              left: `${Math.min(left, 99)}%`,
              width: `${Math.max(width, 0.8)}%`,
              backgroundColor: `${ann.color}30`,
              borderLeft: `2px solid ${ann.color}`,
              boxShadow: `0 0 8px ${ann.color}40`,
            }}
            title={ann.content}
          >
            {/* Glow dot */}
            <div
              className="absolute -top-0.5 -left-[3px] h-2 w-2 rounded-full"
              style={{
                backgroundColor: ann.color,
                boxShadow: `0 0 6px ${ann.color}`,
              }}
            />
          </div>
        );
      })}

      {/* Labels */}
      <div className="absolute bottom-0 left-2 text-[8px] text-muted-foreground font-mono-code">0s</div>
      <div className="absolute bottom-0 right-2 text-[8px] text-muted-foreground font-mono-code">{totalDuration}s</div>
    </div>
  );
};

export default TimelineMarkers;
