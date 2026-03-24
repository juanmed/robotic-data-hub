import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import {
  Database, Clock, CheckCircle2, Upload, AlertTriangle, ChevronRight,
  Bot, Film, Layers, LayoutGrid,
} from "lucide-react";
import { getDatasetFileUrls } from "@/services/datasetService";
import type { DatasetListItem } from "@/services/datasetService";

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  uploading: { icon: Upload, label: "Uploading", className: "bg-secondary/10 text-secondary border-secondary/20" },
  ready: { icon: CheckCircle2, label: "Ready", className: "bg-primary/10 text-primary border-primary/20" },
  failed: { icon: AlertTriangle, label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface DatasetMeta {
  robot_type?: string;
  total_episodes?: number;
  total_frames?: number;
  total_tasks?: number;
}

function findVideoPath(paths: string[]): string | null {
  // Look for video files in common lerobot paths
  const videoDirs = [
    "videos/observation.images.front/chunk-000",
    "videos/observation.images.top/chunk-000",
    "videos/observation.images/chunk-000",
    "videos/",
  ];
  for (const dir of videoDirs) {
    const match = paths.find(
      (p) => p.startsWith(dir) && (p.endsWith(".mp4") || p.endsWith(".webm") || p.endsWith(".avi"))
    );
    if (match) return match;
  }
  // Fallback: any mp4 file
  return paths.find((p) => p.endsWith(".mp4")) ?? null;
}

function formatDateTimeGMT(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { timeZone: "GMT", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) + " GMT";
}

const DatasetListCard = ({ ds }: { ds: DatasetListItem }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<DatasetMeta | null>(null);

  useEffect(() => {
    if (ds.status !== "ready") return;

    const videoPath = findVideoPath(ds.file_paths);
    const metaPath = ds.file_paths.find((p) => p === "meta/info.json");
    const pathsToFetch = [videoPath, metaPath].filter(Boolean) as string[];
    if (pathsToFetch.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const urls = await getDatasetFileUrls(ds.id, pathsToFetch);
        if (cancelled) return;

        // Set video thumbnail
        const videoUrl = urls.find((u) => u.relative_path === videoPath);
        if (videoUrl?.signed_url) setThumbnailUrl(videoUrl.signed_url);

        // Fetch meta/info.json
        const metaUrl = urls.find((u) => u.relative_path === "meta/info.json");
        if (metaUrl?.signed_url) {
          const res = await fetch(metaUrl.signed_url);
          if (res.ok) {
            const json = await res.json();
            if (!cancelled) {
              setMeta({
                robot_type: json.robot_type,
                total_episodes: json.total_episodes,
                total_frames: json.total_frames,
                total_tasks: json.total_tasks,
              });
            }
          }
        }
      } catch {
        // silent
      }
    })();
    return () => { cancelled = true; };
  }, [ds.id, ds.status, ds.file_paths]);

  const sc = statusConfig[ds.status] || statusConfig.uploading;
  const StatusIcon = sc.icon;

  return (
    <Link to={`/dashboard/datasets/${ds.id}`}>
      <GlassCard hover className="flex items-center gap-4 cursor-pointer group">
        {/* Thumbnail */}
        <div className="w-24 h-16 rounded-lg bg-muted/30 border border-border/30 overflow-hidden shrink-0 flex items-center justify-center">
          {thumbnailUrl ? (
            <video
              src={thumbnailUrl}
              muted
              preload="metadata"
              className="w-full h-full object-cover"
              onLoadedData={(e) => {
                const v = e.currentTarget;
                v.currentTime = 0.1;
              }}
            />
          ) : (
            <Film className="h-5 w-5 text-muted-foreground/40" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">{ds.display_name}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${sc.className}`}>
              <StatusIcon className="h-3 w-3" />
              {sc.label}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground mt-1.5">
            <span>{ds.file_count} file{ds.file_count !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTimeGMT(ds.created_at)}
            </span>
            {meta?.robot_type && (
              <span className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {meta.robot_type}
              </span>
            )}
            {meta?.total_episodes != null && (
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {meta.total_episodes} episodes
              </span>
            )}
            {meta?.total_frames != null && (
              <span className="flex items-center gap-1">
                <Film className="h-3 w-3" />
                {meta.total_frames.toLocaleString()} frames
              </span>
            )}
            {meta?.total_tasks != null && (
              <span className="flex items-center gap-1">
                <LayoutGrid className="h-3 w-3" />
                {meta.total_tasks} task{meta.total_tasks !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </GlassCard>
    </Link>
  );
};

export default DatasetListCard;
