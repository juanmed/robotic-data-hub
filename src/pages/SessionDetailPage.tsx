import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import AddStreamModal from "@/components/AddStreamModal";
import { Button } from "@/components/ui/button";
import { sessionService } from "@/services/sessionService";
import type { Session, Stream } from "@/types";
import { ArrowLeft, Radio, FileText, Clock, Plus, Film, Mic, Activity, Radar, Box, Crosshair, CircuitBoard } from "lucide-react";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const streamTypeConfig: Record<string, { icon: typeof Film; color: string; label: string }> = {
  video:  { icon: Film,          color: "hsl(var(--primary))",    label: "Video" },
  audio:  { icon: Mic,           color: "hsl(var(--secondary))",  label: "Audio" },
  imu:    { icon: Activity,      color: "hsl(45 100% 55%)",       label: "IMU" },
  lidar:  { icon: Radar,         color: "hsl(140 70% 50%)",       label: "LiDAR" },
  depth:  { icon: Box,           color: "hsl(200 80% 55%)",       label: "Depth" },
  pose:   { icon: Crosshair,     color: "hsl(330 70% 60%)",       label: "Pose" },
  other:  { icon: CircuitBoard,  color: "hsl(var(--muted-foreground))", label: "Other" },
};

const statusColor: Record<string, string> = {
  completed: "bg-primary/10 text-primary",
  recording: "bg-secondary/10 text-secondary",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStream, setShowAddStream] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([sessionService.get(id), sessionService.getStreams(id)]).then(([s, st]) => {
      setSession(s || null);
      setStreams(st);
      setLoading(false);
    });
  }, [id]);

  const handleAddStream = useCallback(
    (data: { name: string; type: Stream["type"]; device_name: string; sample_rate: string }) => {
      if (!id) return;
      sessionService.addStream(id, data).then((newStream) => {
        setStreams((prev) => [...prev, newStream]);
        setShowAddStream(false);
      });
    },
    [id]
  );

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-lg bg-muted/20 animate-pulse" />
          <div className="h-32 rounded-2xl bg-muted/20 animate-pulse" />
          <div className="h-24 rounded-2xl bg-muted/20 animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  if (!session) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Session not found.</p>
          <Button variant="neon-outline" asChild>
            <Link to="/sessions">Back to Sessions</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/sessions"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sessions
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{session.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusColor[session.status] || ""}`}>
                {session.status}
              </span>
            </div>
            {session.description && (
              <p className="text-sm text-muted-foreground">{session.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <GlassCard hover={false}>
          <Radio className="h-4 w-4 text-primary mb-2" />
          <p className="text-xl font-bold text-foreground">{streams.length}</p>
          <p className="text-xs text-muted-foreground">Streams</p>
        </GlassCard>
        <GlassCard hover={false}>
          <FileText className="h-4 w-4 text-primary mb-2" />
          <p className="text-xl font-bold text-foreground">{formatBytes(session.total_size_bytes)}</p>
          <p className="text-xs text-muted-foreground">Total Size</p>
        </GlassCard>
        <GlassCard hover={false}>
          <Clock className="h-4 w-4 text-primary mb-2" />
          <p className="text-xl font-bold text-foreground">{new Date(session.created_at).toLocaleDateString()}</p>
          <p className="text-xs text-muted-foreground">Created</p>
        </GlassCard>
      </div>

      {/* Streams Timeline */}
      <div className="flex items-center justify-between mb-6">
        <SectionHeader
          title="Sensor Streams"
          subtitle={streams.length > 0 ? `${streams.length} stream(s) in this session.` : "No streams yet."}
          className="mb-0"
        />
        <Button variant="neon" size="sm" onClick={() => setShowAddStream(true)}>
          <Plus className="h-4 w-4" />
          Add Stream
        </Button>
      </div>

      {streams.length === 0 ? (
        <GlassCard hover={false} className="text-center py-16">
          <Radio className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4">No sensor streams recorded yet.</p>
          <Button variant="neon" size="sm" onClick={() => setShowAddStream(true)}>
            <Plus className="h-4 w-4" />
            Add First Stream
          </Button>
        </GlassCard>
      ) : (
        <div className="relative space-y-0">
          {/* Timeline rail */}
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border/40" />

          {streams.map((stream, i) => {
            const cfg = streamTypeConfig[stream.type] || streamTypeConfig.other;
            const Icon = cfg.icon;
            const files = stream.files || [];

            return (
              <div
                key={stream.id}
                className="relative pl-12 pb-6 last:pb-0 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
              >
                {/* Timeline node */}
                <div
                  className="absolute left-2.5 top-3 h-[14px] w-[14px] rounded-full border-2 border-background"
                  style={{ backgroundColor: cfg.color, boxShadow: `0 0 10px ${cfg.color}` }}
                />

                {/* Stream card */}
                <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden hover:border-border/60 transition-all duration-300 group hover:shadow-[0_0_20px_hsl(var(--primary)/0.06)]">
                  {/* Track header bar */}
                  <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

                  <div className="p-5">
                    {/* Stream info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${cfg.color}15` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{stream.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                            {stream.device_name && (
                              <span className="text-[10px] text-muted-foreground">{stream.device_name}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs text-muted-foreground">
                        {stream.sample_rate && <p className="font-mono-code text-foreground">{stream.sample_rate}</p>}
                        <p>{stream.file_count} file{stream.file_count !== 1 ? "s" : ""}</p>
                      </div>
                    </div>

                    {/* Files list */}
                    {files.length > 0 && (
                      <div className="rounded-xl border border-border/30 bg-background/40 divide-y divide-border/20">
                        {files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono-code text-foreground">{file.filename}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span>{formatBytes(file.size_bytes)}</span>
                              <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {files.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border/30 bg-background/20 px-4 py-3 text-center">
                        <p className="text-[11px] text-muted-foreground">No files uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddStreamModal
        open={showAddStream}
        onClose={() => setShowAddStream(false)}
        onAdd={handleAddStream}
      />
    </PageContainer>
  );
};

export default SessionDetailPage;
