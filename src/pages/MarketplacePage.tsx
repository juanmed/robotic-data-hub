import { useEffect, useState } from "react";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { listingService } from "@/services/listingService";
import type { Listing } from "@/types";
import { Download, Search } from "lucide-react";

const MarketplacePage = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listingService.list().then((l) => { setListings(l); setLoading(false); });
  }, []);

  const filtered = query
    ? listings.filter((l) => l.title.toLowerCase().includes(query.toLowerCase()) || l.tags.some((t) => t.includes(query.toLowerCase())))
    : listings;

  return (
    <PageContainer>
      <SectionHeader title="Marketplace" subtitle="Browse and download robotics datasets from the community." />

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search datasets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border/50 bg-card/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 backdrop-blur-sm transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-2xl bg-muted/20 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((listing) => (
            <GlassCard key={listing.id} className="flex flex-col justify-between cursor-pointer">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{listing.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{listing.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {listing.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                <span className="text-sm font-semibold text-foreground">
                  {listing.price_cents === 0 ? "Free" : `$${(listing.price_cents / 100).toFixed(2)}`}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Download className="h-3 w-3" />
                  {listing.download_count}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default MarketplacePage;
