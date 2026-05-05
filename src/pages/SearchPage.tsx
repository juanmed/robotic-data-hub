import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Radio, Sparkles, Database, ArrowRight } from "lucide-react";
import { searchService, type SearchResult } from "@/services/searchService";
import GlassCard from "@/components/GlassCard";

const streamTypeColors: Record<string, string> = {
  video: "hsl(var(--primary))",
  audio: "hsl(var(--secondary))",
  imu: "hsl(45 100% 55%)",
  lidar: "hsl(140 70% 50%)",
  depth: "hsl(200 80% 55%)",
  pose: "hsl(330 70% 60%)",
  other: "hsl(var(--muted-foreground))",
};

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (q: string, isMounted?: () => boolean) => {
    setQuery(q);
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchService.search(q);
      if (isMounted && !isMounted()) return;
      setResults(res);
    } finally {
      if (isMounted && !isMounted()) return;
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;
    void handleSearch("", isMounted);
    return () => {
      mounted = false;
    };
  }, [handleSearch]);

  return (
    <div className="min-h-screen pt-16 bg-background">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--secondary)/0.06),transparent_60%)]" />

        <div className="relative container mx-auto px-6 pt-16 pb-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Dataset Search</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Find the perfect{" "}
              <span className="bg-clip-text text-transparent bg-[image:var(--gradient-neon)]">
                dataset
              </span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Search sessions by title, description, annotations, or stream types.
            </p>
          </div>

          {/* Neon search bar */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative group">
              {/* Glow behind */}
              <div className="absolute -inset-1 rounded-2xl bg-[image:var(--gradient-neon)] opacity-20 blur-xl group-focus-within:opacity-40 transition-opacity duration-500" />
              <div className="relative flex items-center rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-sm overflow-hidden group-focus-within:border-primary/60 transition-colors shadow-[var(--glow-cyan)]">
                <Search className="h-5 w-5 text-primary ml-5 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, description, annotation, stream type..."
                  className="flex-1 bg-transparent py-4 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="submit"
                  className="mr-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Quick filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {["video", "lidar", "imu", "depth", "audio", "pose"].map((t) => (
              <button
                key={t}
                onClick={() => handleSearch(t)}
                className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-border/40 bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-6 pb-20">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted/20 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-20">
            <Database className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No datasets match your search.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-6">
              {results.length} result{results.length !== 1 ? "s" : ""}
              {query && <> for "<span className="text-foreground font-medium">{query}</span>"</>}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map(({ session, streams, matchedAnnotations, previewImage }) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="group block"
                >
                  <div className="relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_40px_hsl(var(--primary)/0.12)] hover:-translate-y-1">
                    {/* Glow overlay on hover */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Preview image */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={previewImage}
                        alt={`Preview of ${session.name}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                      {/* Stream type pills */}
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                        {[...new Set(streams.map((s) => s.type))].map((type) => (
                          <span
                            key={type}
                            className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider backdrop-blur-sm border"
                            style={{
                              color: streamTypeColors[type] || streamTypeColors.other,
                              borderColor: `${streamTypeColors[type] || streamTypeColors.other}`,
                              backgroundColor: "hsl(var(--card) / 0.8)",
                            }}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                        {session.name}
                      </h3>
                      {session.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                          {session.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Radio className="h-3 w-3" />
                            {streams.length} stream{streams.length !== 1 ? "s" : ""}
                          </span>
                          {matchedAnnotations > 0 && (
                            <span className="text-primary">
                              {matchedAnnotations} annotation match{matchedAnnotations !== 1 ? "es" : ""}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
