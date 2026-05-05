import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { listingService } from "@/services/listingService";
import { orderService } from "@/services/orderService";
import { getMarketplaceFileUrls } from "@/services/marketplaceService";
import { formatPrice, getLicense } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
import CheckoutModal from "@/components/CheckoutModal";
import DownloadModal from "@/components/DownloadModal";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { Listing } from "@/types";
import {
  ArrowLeft, Download, ShoppingCart, CheckCircle2, Tag, User,
  Calendar, Star, Loader2, LogIn, Scale, Film,
  Bot, Layers, LayoutGrid,
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

const ListingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acquiring, setAcquiring] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [creatorName, setCreatorName] = useState("Unknown");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<DatasetMeta | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [l, existingOrder] = await Promise.all([
          listingService.get(id),
          orderService.getByListing(id).catch(() => undefined),
        ]);
        if (l) {
          setListing(l);
          if (existingOrder) setPurchased(true);

          // Fetch creator name
          const { data: profile } = await supabase
            .from("public_profiles")
            .select("display_name")
            .eq("id", l.user_id)
            .maybeSingle();
          if ((profile as any)?.display_name) setCreatorName((profile as any).display_name);

          // Fetch file paths for thumbnail + metadata
          const { data: files } = await supabase
            .from("dataset_files")
            .select("relative_path")
            .eq("dataset_id", l.dataset_id);
          const filePaths = (files ?? []).map((f: any) => f.relative_path as string);

          const videoPath = findVideoPath(filePaths);
          const metaPath = filePaths.find((p: string) => p === "meta/info.json");
          const pathsToFetch = [videoPath, metaPath].filter(Boolean) as string[];

          if (pathsToFetch.length > 0) {
            try {
              const urls = await getMarketplaceFileUrls(l.dataset_id, pathsToFetch);

              const videoUrl = urls.find((u) => u.relative_path === videoPath);
              if (videoUrl?.signed_url) setThumbnailUrl(videoUrl.signed_url);

              const metaUrl = urls.find((u) => u.relative_path === "meta/info.json");
              if (metaUrl?.signed_url) {
                const res = await fetch(metaUrl.signed_url);
                if (res.ok) {
                  const json = await res.json();
                  setMeta({
                    robot_type: json.robot_type,
                    total_episodes: json.total_episodes,
                    total_frames: json.total_frames,
                    total_tasks: json.total_tasks,
                  });
                }
              }
            } catch {
              // silent - thumbnail/meta are optional
            }
          }
        }
      } catch {
        // handled by !listing state
      }
      setLoading(false);
    })();
  }, [id]);

  const handleFreePurchase = useCallback(async () => {
    if (!listing) return;
    setAcquiring(true);
    try {
      await orderService.create(listing.id, 0, listing.currency);
      setPurchased(true);
    } catch {
      // toast error
    }
    setAcquiring(false);
  }, [listing]);

  const handlePaidPurchase = useCallback(async () => {
    if (!listing) return;
    await orderService.create(listing.id, listing.price_amount, listing.currency);
    setPurchased(true);
  }, [listing]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-background">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="h-64 rounded-2xl bg-muted/20 animate-pulse mb-6" />
          <div className="h-40 rounded-2xl bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen pt-20 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Listing not found.</p>
          <Button variant="neon-outline" asChild>
            <Link to="/marketplace">Back to Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isFree = listing.price_amount === 0;
  const licenseInfo = getLicense(listing.license);

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--secondary)/0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.04),transparent_60%)]" />
      </div>

      <div className="relative container mx-auto px-6 py-10 max-w-5xl">
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-3.5 w-3.5" /> Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image/video */}
            <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-muted/20">
              {thumbnailUrl ? (
                <video
                  src={thumbnailUrl}
                  muted
                  preload="metadata"
                  className="w-full h-64 md:h-80 object-cover"
                  onLoadedData={(e) => { e.currentTarget.currentTime = 0.1; }}
                />
              ) : (
                <div className="w-full h-64 md:h-80 flex items-center justify-center">
                  <Film className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              {listing.download_count > 100 && (
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-card/80 backdrop-blur-sm text-yellow-400 border border-yellow-400/20">
                    <Star className="h-3 w-3 fill-yellow-400" /> Popular
                  </span>
                </div>
              )}
            </div>

            {/* Title & description */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{listing.title}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
            </div>

            {/* Metadata */}
            {meta && (
              <GlassCard hover={false}>
                <h3 className="text-xs font-semibold text-foreground mb-3">Dataset Info</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
                  {meta.robot_type && (
                    <span className="flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-primary" /> {meta.robot_type}
                    </span>
                  )}
                  {meta.total_episodes != null && (
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary" /> {meta.total_episodes} episodes
                    </span>
                  )}
                  {meta.total_frames != null && (
                    <span className="flex items-center gap-1.5">
                      <Film className="h-3.5 w-3.5 text-primary" /> {meta.total_frames.toLocaleString()} frames
                    </span>
                  )}
                  {meta.total_tasks != null && (
                    <span className="flex items-center gap-1.5">
                      <LayoutGrid className="h-3.5 w-3.5 text-primary" /> {meta.total_tasks} task{meta.total_tasks !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-muted/30 text-muted-foreground border border-border/30">
                  <Tag className="h-2.5 w-2.5" /> {tag}
                </span>
              ))}
            </div>

            {/* License info */}
            <GlassCard hover={false}>
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-primary" /> License
              </h3>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  {licenseInfo.label}
                </span>
                <span className="text-[11px] text-muted-foreground">{licenseInfo.description}</span>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar — purchase card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 space-y-5">
                {/* Price */}
                <div className="text-center">
                  {isFree ? (
                    <div className="inline-block px-5 py-2 rounded-full text-lg font-bold text-primary bg-primary/10 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.25)]">
                      Free
                    </div>
                  ) : (
                    <div className="inline-block px-5 py-2 rounded-full text-lg font-bold text-secondary bg-secondary/10 border border-secondary/30 shadow-[0_0_20px_hsl(var(--secondary)/0.25)]">
                      {formatPrice(listing.price_amount, listing.currency)}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="space-y-3 text-[11px]">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Creator:{" "}
                      <Link to={`/users/${listing.user_id}`} className="text-foreground font-medium hover:underline">
                        {creatorName}
                      </Link>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span>{listing.download_count} downloads</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>Published {new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action buttons */}
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-[11px] text-muted-foreground text-center">Sign in to purchase or download this dataset.</p>
                    <Button variant="neon" className="w-full gap-2" asChild>
                      <Link to="/login"><LogIn className="h-4 w-4" /> Sign in to Continue</Link>
                    </Button>
                  </div>
                ) : purchased ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4" /> Purchased
                    </div>
                    <Button variant="neon" className="w-full gap-2" onClick={() => setDownloadOpen(true)}>
                      <Download className="h-4 w-4" /> Download Dataset
                    </Button>
                  </div>
                ) : isFree ? (
                  <Button variant="neon" className="w-full gap-2" onClick={handleFreePurchase} disabled={acquiring}>
                    {acquiring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {acquiring ? "Acquiring..." : "Get for Free"}
                  </Button>
                ) : (
                  <Button variant="neon" className="w-full gap-2" onClick={() => setCheckoutOpen(true)}>
                    <ShoppingCart className="h-4 w-4" /> Purchase
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {listing && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          onConfirm={handlePaidPurchase}
          title={listing.title}
          priceCents={listing.price_amount}
        />
      )}

      {listing && (
        <DownloadModal
          open={downloadOpen}
          onClose={() => setDownloadOpen(false)}
          datasetTitle={listing.title}
        />
      )}
    </div>
  );
};

export default ListingPage;
