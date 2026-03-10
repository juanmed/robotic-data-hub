import { ExternalLink } from "lucide-react";
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
  className = "",
}: LerobotVisualizerProps) => {
  const url = (() => {
    const params = new URLSearchParams();
    if (datasetId) params.set("dataset", datasetId);
    if (episode !== undefined) params.set("episode", String(episode));
    const query = params.toString();
    return `${VISUALIZER_BASE}${query ? `?${query}` : ""}`;
  })();

  return (
    <div className={`rounded-2xl border border-primary/20 bg-card/40 p-10 text-center space-y-4 ${className}`}>
      <p className="text-sm text-muted-foreground">
        Open the LeRobot dataset visualizer to explore recorded episodes.
      </p>
      <Button
        variant="neon"
        size="lg"
        onClick={() => window.open(url, "_blank")}
        className="gap-2"
      >
        <ExternalLink className="h-4 w-4" />
        Open Visualizer
      </Button>
    </div>
  );
};

export default LerobotVisualizer;
