import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import CreateSessionModal from "@/components/CreateSessionModal";
import { sessionService } from "@/services/sessionService";
import { listingService } from "@/services/listingService";
import { listDatasets } from "@/services/datasetService";
import type { Session, Listing, Dataset } from "@/types";
import {
  Layers, ShoppingBag, HardDrive, Activity, Plus, Radio, Calendar,
  Database, CheckCircle2, Upload, FileText, AlertTriangle, Clock, ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const sessionStatusColor: Record<string, string> = {
  completed: "bg-primary/10 text-primary",
  recording: "bg-secondary/10 text-secondary",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

const datasetStatusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  uploading: { icon: Upload, label: "Uploading", className: "bg-secondary/10 text-secondary border-secondary/20" },
  ready: { icon: CheckCircle2, label: "Ready", className: "bg-primary/10 text-primary border-primary/20" },
  failed: { icon: AlertTriangle, label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const DashboardPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [datasets, setDatasets] = useState<(Dataset & { file_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      sessionService.list(),
      listingService.list(),
      listDatasets(),
    ])
      .then(([s, l, d]) => {
        setSessions(s);
        setListings(l);
        setDatasets(d);
      })
      .catch((err) => console.error("Dashboard load error:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = useCallback((name: string, description: string) => {
    sessionService.create({ name, description }).then((newSession) => {
      setSessions((prev) => [newSession, ...prev]);
      setShowModal(false);
    });
  }, []);

  const totalSize = sessions.reduce((a, s) => a + s.total_size_bytes, 0);
  const totalDownloads = listings.reduce((a, l) => a + l.download_count, 0);

  const stats = [
    { icon: Layers, label: "Sessions", value: sessions.length },
    { icon: HardDrive, label: "Total Data", value: formatBytes(totalSize) },
    { icon: Database, label: "Datasets", value: datasets.length },
    { icon: Activity, label: "Downloads", value: totalDownloads },
  ];

  return (
    <PageContainer>
      <SectionHeader title="Dashboard" subtitle="Overview of your robotics data platform." />

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-muted/20 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map(({ icon: Icon, label, value }) => (
              <GlassCard key={label} hover={false}>
                <Icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </GlassCard>
            ))}
          </div>

          {/* Sessions */}
          <div className="flex items-center justify-between mb-6">
            <SectionHeader title="Sessions" className="mb-0" />
            <Button variant="neon" size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          </div>

          {sessions.length === 0 ? (
            <GlassCard hover={false} className="text-center py-16 mb-10">
              <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No sessions yet. Create one to get started.</p>
              <Button variant="neon" size="sm" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" />
                Create First Session
              </Button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
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
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {session.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 ml-2 ${sessionStatusColor[session.status] || ""}`}>
                          {session.status}
                        </span>
                      </div>
                      {session.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                          {session.description}
                        </p>
                      )}
                    </div>
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

          {/* Datasets */}
          <SectionHeader title="Datasets" className="mb-6" />
          {datasets.length === 0 ? (
            <GlassCard hover={false} className="text-center py-12">
              <Database className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No datasets yet. Upload one using the CLI and an upload key from the{" "}
                <Link to="/keys" className="text-primary hover:underline">Keys</Link> page.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {datasets.map((ds) => {
                const sc = datasetStatusConfig[ds.status] || datasetStatusConfig.draft;
                const StatusIcon = sc.icon;
                return (
                  <Link key={ds.id} to={`/dashboard/datasets/${ds.id}`}>
                    <GlassCard hover className="flex items-center justify-between gap-4 cursor-pointer group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Database className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{ds.display_name}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${sc.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-1.5">
                          <span>{ds.file_count} file{ds.file_count !== 1 ? "s" : ""}</span>
                          <span>{ds.file_count} file{ds.file_count !== 1 ? "s" : ""}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(ds.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      <CreateSessionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />
    </PageContainer>
  );
};

export default DashboardPage;
