import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { sessionService } from "@/services/sessionService";
import type { Session, Stream } from "@/types";
import { ArrowLeft, Radio, FileText, Clock } from "lucide-react";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const streamTypeIcon: Record<string, string> = {
  video: "🎥",
  lidar: "📡",
  imu: "📈",
  audio: "🎙️",
  depth: "🌊",
  custom: "⚙️",
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

  useEffect(() => {
    if (!id) return;
    Promise.all([sessionService.get(id), sessionService.getStreams(id)]).then(([s, st]) => {
      setSession(s || null);
      setStreams(st);
      setLoading(false);
    });
  }, [id]);

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
          <p className="text-xl font-bold text-foreground">{session.stream_count}</p>
          <p className="text-xs text-muted-foreground">Streams</p>
        </GlassCard>
        <GlassCard hover={false}>
          <FileText className="h-4 w-4 text-primary mb-2" />
          <p className="text-xl font-bold text-foreground">{formatBytes(session.total_size_bytes)}</p>
          <p className="text-xs text-muted-foreground">Total Size</p>
        </GlassCard>
        <GlassCard hover={false}>
          <Clock className="h-4 w-4 text-primary mb-2" />
          <p className="text-xl font-bold text-foreground">
            {new Date(session.created_at).toLocaleDateString()}
          </p>
          <p className="text-xs text-muted-foreground">Created</p>
        </GlassCard>
      </div>

      {/* Streams */}
      <SectionHeader title="Sensor Streams" subtitle={streams.length > 0 ? `${streams.length} stream(s) in this session.` : "No streams yet."} />

      {streams.length === 0 ? (
        <GlassCard hover={false} className="text-center py-12">
          <Radio className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No sensor streams recorded yet.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((stream, i) => (
            <GlassCard
              key={stream.id}
              className="animate-slide-up"
              hover
            >
              <div className="flex items-center gap-2 mb-3" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="text-lg">{streamTypeIcon[stream.type] || "⚙️"}</span>
                <h3 className="text-sm font-semibold text-foreground">{stream.name}</h3>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="text-foreground capitalize">{stream.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Format</span>
                  <span className="font-mono-code text-primary">.{stream.format}</span>
                </div>
                <div className="flex justify-between">
                  <span>Files</span>
                  <span className="text-foreground">{stream.file_count.toLocaleString()}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default SessionDetailPage;
