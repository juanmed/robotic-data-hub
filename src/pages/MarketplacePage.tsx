import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listingService } from "@/services/listingService";
import { challengeService } from "@/services/challengeService";
import MarketplaceCard from "@/components/MarketplaceCard";
import ChallengeCard from "@/components/ChallengeCard";
import type { EnrichedListing, EnrichedChallenge } from "@/types";
import { Search, Store, Tag, Target } from "lucide-react";

type Tab = "datasets" | "challenges";

const MarketplacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "datasets";
  const [listings, setListings] = useState<EnrichedListing[]>([]);
  const [challenges, setChallenges] = useState<EnrichedChallenge[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTag, setActiveTag] = useState<string | null>(searchParams.get("tag") || null);

  useEffect(() => {
    let cancelled = false;

    listingService.listEnriched().then((l) => {
      if (cancelled) return;
      setListings(l);
      setLoadingDatasets(false);
    }).catch(() => {
      if (cancelled) return;
      setLoadingDatasets(false);
    });

    challengeService.listEnriched().then((c) => {
      if (cancelled) return;
      setChallenges(c);
      setLoadingChallenges(false);
    }).catch(() => {
      if (cancelled) return;
      setLoadingChallenges(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setTab = (t: Tab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", t);
    setSearchParams(params, { replace: true });
  };

  const allDatasetTags = [...new Set(listings.flatMap((l) => l.tags))];
  const allChallengeTags = [...new Set(challenges.flatMap((c) => c.tags))];
  const allTags = tab === "datasets" ? allDatasetTags : allChallengeTags;

  const filteredListings = listings.filter((l) => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.tags.some((t) => t.toLowerCase().includes(q));
    const matchTag = !activeTag || l.tags.includes(activeTag);
    return matchQuery && matchTag;
  });

  const filteredChallenges = challenges.filter((c) => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));
    const matchTag = !activeTag || c.tags.includes(activeTag);
    return matchQuery && matchTag;
  });

  const loading = tab === "datasets" ? loadingDatasets : loadingChallenges;

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
              <span className="text-xs font-medium text-secondary">Marketplace</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Discover robotics{" "}
              <span className="bg-clip-text text-transparent bg-[image:var(--gradient-neon)]">
                {tab === "datasets" ? "datasets" : "challenges"}
              </span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              {tab === "datasets"
                ? "Browse high-quality datasets from the community. Free and premium options available."
                : "Find challenges requesting datasets for new robotic tasks. Submit your data and get compensated."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => { setTab("datasets"); setActiveTag(null); }}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold transition-colors border ${
                tab === "datasets"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
              data-testid="tab-datasets"
            >
              <Store className="h-3.5 w-3.5" /> Datasets
            </button>
            <button
              onClick={() => { setTab("challenges"); setActiveTag(null); }}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold transition-colors border ${
                tab === "challenges"
                  ? "border-secondary/50 bg-secondary/10 text-secondary"
                  : "border-border/40 bg-background/40 text-muted-foreground hover:text-foreground hover:border-secondary/30"
              }`}
              data-testid="tab-challenges"
            >
              <Target className="h-3.5 w-3.5" /> Challenges
            </button>
          </div>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-[image:var(--gradient-neon)] opacity-15 blur-xl group-focus-within:opacity-35 transition-opacity duration-500" />
              <div className="relative flex items-center rounded-2xl border border-secondary/30 bg-card/80 backdrop-blur-sm overflow-hidden group-focus-within:border-secondary/60 transition-colors">
                <Search className="h-5 w-5 text-secondary ml-5 shrink-0" />
                <input
                  type="text"
                  placeholder={`Search ${tab} by name, description, or tag...`}
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
        ) : tab === "datasets" ? (
          filteredListings.length === 0 ? (
            <div className="text-center py-20">
              <Tag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No datasets match your filters.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-6">
                {filteredListings.length} dataset{filteredListings.length !== 1 ? "s" : ""} available
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <MarketplaceCard key={listing.id} listing={listing} />
                ))}
              </div>
            </>
          )
        ) : (
          filteredChallenges.length === 0 ? (
            <div className="text-center py-20">
              <Target className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No challenges yet. Be the first to create one!</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-6">
                {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? "s" : ""} available
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChallenges.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
