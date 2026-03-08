import { useEffect, useState } from "react";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { sessionService } from "@/services/sessionService";
import type { Session } from "@/types";
import { Plus } from "lucide-react";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const statusColor: Record<string, string> = {
  completed: "bg-primary/10 text-primary",
  recording: "bg-secondary/10 text-secondary",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

const SessionsPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionService.list().then((s) => { setSessions(s); setLoading(false); });
  }, []);

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-8">
        <SectionHeader title="Sessions" subtitle="Manage your data capture sessions." className="mb-0" />
        <Button variant="neon" size="sm">
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted/20 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <GlassCard key={session.id} className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{session.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{session.description}</p>
              </div>
              <div className="flex items-center gap-5 text-xs text-muted-foreground">
                <div className="text-right">
                  <p className="text-foreground font-medium">{session.stream_count} streams</p>
                  <p>{formatBytes(session.total_size_bytes)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusColor[session.status] || ""}`}>
                  {session.status}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default SessionsPage;
