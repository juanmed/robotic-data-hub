import { useEffect, useState } from "react";
import { listingService } from "@/services/listingService";
import MarketplaceCard from "@/components/MarketplaceCard";
import type { EnrichedListing } from "@/types";
import { Search, Store, Tag } from "lucide-react";

const MarketplacePage = () => {
  const [listings, setListings] = useState<EnrichedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    listingService.listEnriched().then((l) => {
      setListings(l);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const allTags = [...new Set(listings.flatMap((l) => l.tags))];

  const filtered = listings.filter((l) => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.tags.some((t) => t.toLowerCase().includes(q));
    const matchTag = !activeTag || l.tags.includes(activeTag);
    return matchQuery && matchTag;
  });

  return (
    <div className="min-h-screen pt-16 bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.06),transparent_60%)]" />

        <div className="relative container mx-auto px-6 pt-16 pb-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/20 bg-secondary/5 mb-6">
              <Store className="h-3.5 w-3.5 text-secondary" />
              <span className="text-xs font-medium text-secondary">Dataset Marketplace</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Discover robotics{" "}
              <span className="bg-clip-text text-transparent bg-[image:var(--gradient-neon)]">datasets</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Browse high-quality datasets from the community. Free and premium options available.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-[image:var(--gradient-neon)] opacity-15 blur-xl group-focus-within:opacity-35 transition-opacity duration-500" />
              <div className="relative flex items-center rounded-2xl border border-secondary/30 bg-card/80 backdrop-blur-sm overflow-hidden group-focus-within:border-secondary/60 transition-colors">
                <Search className="h-5 w-5 text-secondary ml-5 shrink-0" />
                <input
                  type="text"
                  placeholder="Search datasets by name, description, or tag..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent py-4 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Tag filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-colors ${
                !activeTag
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-colors ${
                  activeTag === tag
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="container mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No datasets match your filters.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-6">
              {filtered.length} dataset{filtered.length !== 1 ? "s" : ""} available
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((listing) => (
                <MarketplaceCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
