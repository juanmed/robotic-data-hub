import { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSessionData } from "@/hooks/useSessionData";
import { useDatasetEpisodes } from "@/hooks/useDatasetEpisodes";
import { annotationService, type SessionAnnotation } from "@/services/annotationService";
import LerobotVisualizer from "@/components/LerobotVisualizer";
import AnnotationPanel from "@/components/AnnotationPanel";
import TimelineMarkers from "@/components/TimelineMarkers";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Radio,
  Film,
  Mic,
  Activity,
  Radar,
  Box,
  Crosshair,
  CircuitBoard,
  RefreshCw,
  BookOpen,
  Bookmark,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

const streamTypeConfig: Record<string, { icon: typeof Film; color: string; label: string }> = {
  video: { icon: Film, color: "hsl(var(--primary))", label: "Video" },
  audio: { icon: Mic, color: "hsl(var(--secondary))", label: "Audio" },
  imu: { icon: Activity, color: "hsl(45 100% 55%)", label: "IMU" },
  lidar: { icon: Radar, color: "hsl(140 70% 50%)", label: "LiDAR" },
  depth: { icon: Box, color: "hsl(200 80% 55%)", label: "Depth" },
  pose: { icon: Crosshair, color: "hsl(330 70% 60%)", label: "Pose" },
  other: { icon: CircuitBoard, color: "hsl(var(--muted-foreground))", label: "Other" },
};

const statusColor: Record<string, string> = {
  completed: "bg-primary/10 text-primary",
  recording: "bg-secondary/10 text-secondary",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

const SessionViewerPage = () => {
  const { id } = useParams<{ id: string }>();
  const { session, streams, loading, datasetId: defaultDatasetId, episode: defaultEpisode } = useSessionData(id);
  const [datasetId, setDatasetId] = useState("");
  const [episode, setEpisode] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vizKey, setVizKey] = useState(0);
  const [annotations, setAnnotations] = useState<SessionAnnotation[]>([]);

  const activeDatasetId = datasetId || defaultDatasetId;
  const activeEpisode = datasetId ? episode : defaultEpisode;

  const { episodes, loading: episodesLoading } = useDatasetEpisodes(activeDatasetId);

  const currentEp = episodes.find((e) => e.index === activeEpisode);
  const totalDuration = currentEp ? parseFloat(currentEp.duration) || 15 : 15;

  // Load annotations once
  useEffect(() => {
    if (id) {
      annotationService.listBySession(id).then(setAnnotations);
    }
  }, [id]);

  const handleAnnotationCreated = useCallback((ann: SessionAnnotation) => {
    setAnnotations((prev) => [ann, ...prev]);
  }, []);

  const handleAnnotationDeleted = useCallback((annId: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== annId));
  }, []);

  const handleReload = useCallback(() => {
    setVizKey((k) => k + 1);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-background">
        <div className="flex h-[calc(100vh-5rem)]">
          <div className="w-80 border-r border-border/40 p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
            ))}
          </div>
          <div className="flex-1 p-6">
            <div className="h-full rounded-2xl bg-muted/20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-20 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Session not found.</p>
          <Button variant="neon-outline" asChild>
            <Link to="/sessions">Back to Sessions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 shrink-0 border-r border-border/40 bg-card/30 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Link
                  to="/sessions"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Sessions
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              {/* Session Metadata */}
              <div className="rounded-xl border border-border/40 bg-background/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-sm font-semibold text-foreground truncate">{session.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider shrink-0 ${statusColor[session.status] || ""}`}>
                    {session.status}
                  </span>
                </div>
                {session.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{session.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                  <span>{streams.length} streams</span>
                  <span>•</span>
                  <span>{new Date(session.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Streams List */}
              <div>
                <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Radio className="h-3 w-3 text-primary" />
                  Streams ({streams.length})
                </h3>
                <div className="space-y-1.5">
                  {streams.map((stream) => {
                    const cfg = streamTypeConfig[stream.type] || streamTypeConfig.other;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={stream.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/30 bg-background/20 hover:border-border/50 transition-colors cursor-default"
                      >
                        <div
                          className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cfg.color}15` }}
                        >
                          <Icon className="h-3 w-3" style={{ color: cfg.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-foreground truncate">{stream.name}</p>
                          <p className="text-[9px] text-muted-foreground">{cfg.label} · {stream.file_count} files</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Annotation Panel */}
              <AnnotationPanel
                sessionId={session.id}
                streams={streams}
                annotations={annotations}
                onAnnotationCreated={handleAnnotationCreated}
                onAnnotationDeleted={handleAnnotationDeleted}
                variant="sidebar"
              />
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors mr-1"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                <Eye className="h-4 w-4 text-primary" />
                <h1 className="text-sm font-semibold text-foreground">Session Visualization</h1>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/sessions/${id}`}>
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Detail View
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Controls */}
            <GlassCard hover={false}>
              <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
                <div className="flex-1 w-full">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Dataset ID
                  </label>
                  <input
                    type="text"
                    value={datasetId}
                    onChange={(e) => setDatasetId(e.target.value)}
                    placeholder={defaultDatasetId}
                    className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm font-mono-code text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </div>

                <div className="w-40">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Episode
                  </label>
                  <select
                    value={activeEpisode}
                    onChange={(e) => setEpisode(Number(e.target.value))}
                    disabled={episodesLoading}
                    className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors appearance-none cursor-pointer"
                  >
                    {episodes.map((ep) => (
                      <option key={ep.index} value={ep.index}>
                        Ep {ep.index} — {ep.duration}
                      </option>
                    ))}
                  </select>
                </div>

                <Button variant="neon" size="default" onClick={handleReload} className="gap-1.5 shrink-0">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reload
                </Button>
              </div>
            </GlassCard>

            {/* Timeline markers */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Annotation Timeline
              </p>
              <TimelineMarkers annotations={annotations} totalDuration={totalDuration} />
            </div>

            {/* Visualizer */}
            <div>
              <LerobotVisualizer
                key={vizKey}
                datasetId={activeDatasetId}
                episode={activeEpisode}
                mode="iframe"
              />
            </div>

            {/* Bottom panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-xs font-semibold text-foreground">Sensor Filters</h3>
                </div>
                <div className="space-y-2">
                  {streams.length > 0 ? streams.map((stream) => {
                    const cfg = streamTypeConfig[stream.type] || streamTypeConfig.other;
                    const Icon = cfg.icon;
                    return (
                      <label key={stream.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/20 bg-background/10 hover:border-border/40 transition-colors cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-border/50 text-primary focus:ring-primary/30 h-3 w-3" />
                        <Icon className="h-3 w-3" style={{ color: cfg.color }} />
                        <span className="text-[11px] text-foreground">{stream.name}</span>
                        <span className="text-[9px] text-muted-foreground ml-auto">{cfg.label}</span>
                      </label>
                    );
                  }) : (
                    <p className="text-[10px] text-muted-foreground text-center py-3">No streams available</p>
                  )}
                </div>
              </GlassCard>

              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-3">
                  <Bookmark className="h-3.5 w-3.5" style={{ color: "hsl(45 100% 55%)" }} />
                  <h3 className="text-xs font-semibold text-foreground">Timeline Bookmarks</h3>
                </div>
                <div className="rounded-lg border border-dashed border-border/30 bg-background/10 px-3 py-5 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    Mark key moments for review, training splits, or export ranges.
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1">Coming soon</p>
                </div>
              </GlassCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SessionViewerPage;
