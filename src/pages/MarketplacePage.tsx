import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listingService } from "@/services/listingService";
import type { Listing } from "@/types";
import {
  Download,
  Search,
  Sparkles,
  Store,
  Tag,
  User,
  ArrowRight,
  Star,
} from "lucide-react";

const PREVIEW_IMAGES = [
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
];

const CREATORS = ["Alex Chen", "Robotics Lab", "DataForge AI", "Chen Wei"];

const MarketplacePage = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    listingService.list().then((l) => {
      setListings(l);
      setLoading(false);
    });
  }, []);

  const allTags = [...new Set(listings.flatMap((l) => l.tags))];

  const filtered = listings.filter((l) => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.tags.some((t) => t.includes(q));
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
              <span className="text-xs font-medium text-secondary">
                Dataset Marketplace
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Discover robotics{" "}
              <span className="bg-clip-text text-transparent bg-[image:var(--gradient-neon)]">
                datasets
              </span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Browse high-quality datasets from the community. Free and premium
              options available.
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
              <div
                key={i}
                className="h-80 rounded-2xl bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              No datasets match your filters.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-6">
              {filtered.length} dataset{filtered.length !== 1 ? "s" : ""}{" "}
              available
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((listing, idx) => {
                const isFree = listing.price_cents === 0;
                const creator = CREATORS[idx % CREATORS.length];
                const image = PREVIEW_IMAGES[idx % PREVIEW_IMAGES.length];

                return (
                  <Link
                    key={listing.id}
                    to={`/marketplace/${listing.id}`}
                    className="group block"
                  >
                    <div className="relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_40px_hsl(var(--primary)/0.12)] hover:-translate-y-1">
                      {/* Hover glow */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.06),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Preview image */}
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={image}
                          alt={`Preview of ${listing.title}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

                        {/* Price badge */}
                        <div className="absolute top-3 right-3">
                          {isFree ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm shadow-[0_0_12px_hsl(var(--primary)/0.3)]">
                              Free
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-secondary/20 text-secondary border border-secondary/30 backdrop-blur-sm shadow-[0_0_12px_hsl(var(--secondary)/0.3)]">
                              ${(listing.price_cents / 100).toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Featured star for popular items */}
                        {listing.download_count > 100 && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-card/80 backdrop-blur-sm text-yellow-400 border border-yellow-400/20">
                              <Star className="h-2.5 w-2.5 fill-yellow-400" />
                              Popular
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="relative p-5">
                        <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                          {listing.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                          {listing.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {listing.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-muted/40 text-muted-foreground border border-border/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/20">
                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {creator}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {listing.download_count}
                            </span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
