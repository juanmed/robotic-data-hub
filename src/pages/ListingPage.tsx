import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { listingService } from "@/services/listingService";
import { orderService } from "@/services/orderService";
import { sessionService } from "@/services/sessionService";
import CheckoutModal from "@/components/CheckoutModal";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import type { Listing, Session } from "@/types";
import {
  ArrowLeft,
  Download,
  ShoppingCart,
  CheckCircle2,
  Tag,
  User,
  Calendar,
  Database,
  Star,
  Loader2,
} from "lucide-react";

const PREVIEW_IMAGES = [
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
];

const CREATORS = ["Alex Chen", "Robotics Lab", "DataForge AI", "Chen Wei"];

const ListingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acquiring, setAcquiring] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [l, existingOrder] = await Promise.all([
        listingService.get(id),
        orderService.getByListing(id),
      ]);
      if (l) {
        setListing(l);
        if (existingOrder) setPurchased(true);
        const s = await sessionService.get(l.session_id);
        if (s) setSession(s);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleFreePurchase = useCallback(async () => {
    if (!listing) return;
    setAcquiring(true);
    await orderService.create(listing.id, 0);
    setPurchased(true);
    setAcquiring(false);
  }, [listing]);

  const handlePaidPurchase = useCallback(async () => {
    if (!listing) return;
    await orderService.create(listing.id, listing.price_cents);
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

  const isFree = listing.price_cents === 0;
  const imageIdx = parseInt(listing.id.replace(/\D/g, ""), 10) || 0;
  const previewImage = PREVIEW_IMAGES[imageIdx % PREVIEW_IMAGES.length];
  const creator = CREATORS[imageIdx % CREATORS.length];

  return (
    <div className="min-h-screen pt-16 bg-background">
      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--secondary)/0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.04),transparent_60%)]" />
      </div>

      <div className="relative container mx-auto px-6 py-10 max-w-5xl">
        {/* Back link */}
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero image */}
            <div className="relative rounded-2xl overflow-hidden border border-border/40">
              <img
                src={previewImage}
                alt={`Preview of ${listing.title}`}
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              {listing.download_count > 100 && (
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-card/80 backdrop-blur-sm text-yellow-400 border border-yellow-400/20">
                    <Star className="h-3 w-3 fill-yellow-400" />
                    Popular
                  </span>
                </div>
              )}
            </div>

            {/* Title & description */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {listing.title}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-muted/30 text-muted-foreground border border-border/30"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Session summary */}
            {session && (
              <GlassCard hover={false}>
                <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-primary" />
                  Session Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Name</p>
                    <p className="text-xs text-foreground font-medium">{session.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <p className="text-xs text-foreground font-medium capitalize">{session.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Streams</p>
                    <p className="text-xs text-foreground font-medium">{session.stream_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Size</p>
                    <p className="text-xs text-foreground font-medium">
                      {(session.total_size_bytes / 1_000_000_000).toFixed(1)} GB
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}
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
                      ${(listing.price_cents / 100).toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="space-y-3 text-[11px]">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span>Creator: <span className="text-foreground font-medium">{creator}</span></span>
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
                {purchased ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Purchased
                    </div>
                    <Button variant="neon" className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      Download Dataset
                    </Button>
                    {session && (
                      <Button variant="neon-outline" className="w-full gap-2" asChild>
                        <Link to={`/sessions/${session.id}`}>
                          View Session
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : isFree ? (
                  <Button
                    variant="neon"
                    className="w-full gap-2"
                    onClick={handleFreePurchase}
                    disabled={acquiring}
                  >
                    {acquiring ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {acquiring ? "Acquiring..." : "Get for Free"}
                  </Button>
                ) : (
                  <Button
                    variant="neon"
                    className="w-full gap-2"
                    onClick={() => setCheckoutOpen(true)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Purchase
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {listing && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          onConfirm={handlePaidPurchase}
          title={listing.title}
          priceCents={listing.price_cents}
        />
      )}
    </div>
  );
};

export default ListingPage;
