import { useState, useMemo } from "react";
import { Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LerobotVisualizerProps {
  datasetId: string;
  episode: number;
  mode?: "iframe" | "component";
  className?: string;
}

const VISUALIZER_BASE = "https://huggingface.co/spaces/lerobot/visualize_dataset";

const LerobotVisualizer = ({
  datasetId,
  episode,
  mode = "iframe",
  className = "",
}: LerobotVisualizerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams();
    if (datasetId) params.set("dataset", datasetId);
    if (episode !== undefined) params.set("episode", String(episode));
    const query = params.toString();
    return `${VISUALIZER_BASE}${query ? `?${query}` : ""}`;
  }, [datasetId, episode]);

  if (mode === "component") {
    return (
      <div className={`rounded-2xl border border-border/40 bg-card/40 p-8 text-center ${className}`}>
        <p className="text-sm text-muted-foreground">
          Local component mode — coming soon.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Switch to iframe mode for the live visualizer.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative group ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-background p-4"
          : className
      }`}
    >
      {/* Glowing frame */}
      <div
        className={`relative rounded-2xl overflow-hidden border border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.08),inset_0_0_30px_hsl(var(--primary)/0.03)] ${
          isFullscreen ? "h-full" : ""
        }`}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent z-10" />

        {/* Controls overlay */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background"
            onClick={() => window.open(iframeSrc, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Iframe */}
        <iframe
          src={iframeSrc}
          title="LeRobot Dataset Visualizer"
          className={`w-full border-0 bg-background ${isFullscreen ? "h-full" : "h-[600px]"}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent z-10" />
      </div>
    </div>
  );
};

export default LerobotVisualizer;
