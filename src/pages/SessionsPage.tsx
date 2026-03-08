import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import CreateSessionModal from "@/components/CreateSessionModal";
import { sessionService } from "@/services/sessionService";
import type { Session } from "@/types";
import { Plus, Radio, Calendar, Layers } from "lucide-react";

const statusColor: Record<string, string> = {
  completed: "bg-primary/10 text-primary",
  recording: "bg-secondary/10 text-secondary",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

const SessionsPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    sessionService.list().then((s) => {
      setSessions(s);
      setLoading(false);
    });
  }, []);

  const handleCreate = useCallback((name: string, description: string) => {
    sessionService.create({ name, description }).then((newSession) => {
      setSessions((prev) => [newSession, ...prev]);
      setShowModal(false);
    });
  }, []);

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-8">
        <SectionHeader title="Sessions" subtitle="Manage your robotics data capture sessions." className="mb-0" />
        <Button variant="neon" size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <GlassCard hover={false} className="text-center py-16">
          <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4">No sessions yet. Create one to get started.</p>
          <Button variant="neon" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Create First Session
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((session, i) => (
            <div
              key={session.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <GlassCard
                className="flex flex-col justify-between h-full cursor-pointer group"
                hover
              >
                <div onClick={() => navigate(`/sessions/${session.id}`)}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {session.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 ml-2 ${statusColor[session.status] || ""}`}>
                      {session.status}
                    </span>
                  </div>

                  {/* Description */}
                  {session.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                      {session.description}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div
                  className="flex items-center gap-4 pt-4 border-t border-border/30 text-xs text-muted-foreground"
                  onClick={() => navigate(`/sessions/${session.id}`)}
                >
                  <span className="flex items-center gap-1.5">
                    <Radio className="h-3 w-3 text-primary" />
                    {session.stream_count} streams
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      )}

      <CreateSessionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />
    </PageContainer>
  );
};

export default SessionsPage;
