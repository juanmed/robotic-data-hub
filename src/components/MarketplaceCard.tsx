import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/marketplace";
import { getMarketplaceFileUrls } from "@/services/marketplaceService";
import type { EnrichedListing } from "@/types";
import {
  Download, Tag, User, ArrowRight, Star, Film,
  Bot, Layers, LayoutGrid, Calendar,
} from "lucide-react";

interface DatasetMeta {
  robot_type?: string;
  total_episodes?: number;
  total_frames?: number;
  total_tasks?: number;
}

function findVideoPath(paths: string[]): string | null {
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
  return paths.find((p) => p.endsWith(".mp4")) ?? null;
}

const MarketplaceCard = ({ listing }: { listing: EnrichedListing }) => {
  const navigate = useNavigate();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<DatasetMeta | null>(null);

  const isFree = listing.price_amount === 0;

  useEffect(() => {
    const videoPath = findVideoPath(listing.file_paths);
    const metaPath = listing.file_paths.find((p) => p === "meta/info.json");
    const pathsToFetch = [videoPath, metaPath].filter(Boolean) as string[];
    if (pathsToFetch.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const urls = await getMarketplaceFileUrls(listing.dataset_id, pathsToFetch);
        if (cancelled) return;

        const videoUrl = urls.find((u) => u.relative_path === videoPath);
        if (videoUrl?.signed_url) setThumbnailUrl(videoUrl.signed_url);

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
  }, [listing.dataset_id, listing.file_paths]);

  return (
    <div className="group block cursor-pointer" onClick={() => navigate(`/marketplace/${listing.id}`)}>
      <div className="relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_40px_hsl(var(--primary)/0.12)] hover:-translate-y-1">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.06),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Thumbnail */}
        <div className="relative h-44 overflow-hidden bg-muted/20 flex items-center justify-center">
          {thumbnailUrl ? (
            <video
              src={thumbnailUrl}
              muted
              preload="metadata"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onLoadedData={(e) => { e.currentTarget.currentTime = 0.1; }}
            />
          ) : (
            <Film className="h-10 w-10 text-muted-foreground/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

          {/* Price badge */}
          <div className="absolute top-3 right-3">
            {isFree ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm shadow-[0_0_12px_hsl(var(--primary)/0.3)]">
                Free
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-secondary/20 text-secondary border border-secondary/30 backdrop-blur-sm shadow-[0_0_12px_hsl(var(--secondary)/0.3)]">
                {formatPrice(listing.price_amount, listing.currency)}
              </span>
            )}
          </div>

          {listing.download_count > 100 && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-card/80 backdrop-blur-sm text-yellow-400 border border-yellow-400/20">
                <Star className="h-2.5 w-2.5 fill-yellow-400" /> Popular
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {listing.description}
          </p>

          {/* Metadata badges */}
          {meta && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground mb-3">
              {meta.robot_type && (
                <span className="flex items-center gap-1">
                  <Bot className="h-3 w-3" /> {meta.robot_type}
                </span>
              )}
              {meta.total_episodes != null && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" /> {meta.total_episodes} ep
                </span>
              )}
              {meta.total_frames != null && (
                <span className="flex items-center gap-1">
                  <Film className="h-3 w-3" /> {meta.total_frames.toLocaleString()} frames
                </span>
              )}
              {meta.total_tasks != null && (
                <span className="flex items-center gap-1">
                  <LayoutGrid className="h-3 w-3" /> {meta.total_tasks} task{meta.total_tasks !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {listing.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-muted/40 text-muted-foreground border border-border/30">
                {tag}
              </span>
            ))}
          </div>

          {/* License */}
          {listing.license && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-medium bg-primary/10 text-primary border border-primary/20 mb-3">
              {listing.license}
            </span>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/20">
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <Link
                  to={`/users/${listing.user_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  {listing.creator_name}
                </Link>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {new Date(listing.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" /> {listing.download_count}
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCard;
