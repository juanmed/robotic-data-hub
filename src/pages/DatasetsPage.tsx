import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Database, FileText, Clock, CheckCircle2, AlertTriangle, Upload, Loader2, ChevronRight, Terminal, Eye } from "lucide-react";
import { listDatasets } from "@/services/datasetService";
import { openVisualizer } from "@/lib/visualizer";
import { toast } from "sonner";
import type { Dataset } from "@/types";

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  uploading: { icon: Upload, label: "Uploading", className: "bg-secondary/10 text-secondary border-secondary/20" },
  ready: { icon: CheckCircle2, label: "Ready", className: "bg-primary/10 text-primary border-primary/20" },
  failed: { icon: AlertTriangle, label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const DatasetsPage = () => {
  const [visualizingId, setVisualizingId] = useState<string | null>(null);

  const handleVisualize = async (datasetId: string) => {
    setVisualizingId(datasetId);
    try {
      await openVisualizer(datasetId);
    } catch (err: any) {
      toast.error(err.message || "Failed to open visualizer");
    } finally {
      setVisualizingId(null);
    }
  };

  const [datasets, setDatasets] = useState<(Dataset & { file_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDatasets();
      setDatasets(data);
    } catch (err: any) {
      setError(err.message || "Failed to load datasets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader
            title="Datasets"
            subtitle="Datasets uploaded via the GamiphyAI CLI."
          />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <GlassCard hover={false} className="text-center py-12">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
              <p className="text-sm text-destructive">{error}</p>
            </GlassCard>
          ) : datasets.length === 0 ? (
            <GlassCard hover={false} className="text-center py-16">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <Database className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No datasets yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Upload your first dataset using the CLI and an upload key. Head to{" "}
                <Link to="/dashboard/upload-keys" className="text-primary hover:underline">Upload Keys</Link>{" "}
                to get started.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {datasets.map((ds) => {
                const sc = statusConfig[ds.status] || statusConfig.uploading;
                const StatusIcon = sc.icon;
                const isReady = ds.status === "ready";
                return (
                  <GlassCard key={ds.id} hover className="flex items-center justify-between gap-4 group">
                    <Link to={`/dashboard/datasets/${ds.id}`} className="flex-1 min-w-0 cursor-pointer">
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
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ds.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={!isReady || visualizingId === ds.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleVisualize(ds.id);
                        }}
                        className={`text-[11px] h-7 px-3 transition-all ${
                          isReady
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)]"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {visualizingId === ds.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Eye className="h-3 w-3 mr-1" />
                        )}
                        Visualize
                      </Button>
                      <Link to={`/dashboard/datasets/${ds.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

        {/* CLI Flow sidebar */}
        <div className="space-y-4">
          <GlassCard hover={false} className="border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">CLI Upload Flow</h3>
            </div>
            <ol className="space-y-3 text-xs text-muted-foreground">
              {[
                { step: "1", text: "Create an upload key", link: "/dashboard/upload-keys" },
                { step: "2", text: "Call init-dataset-upload" },
                { step: "3", text: "Upload files to signed URLs" },
                { step: "4", text: "Call finalize-dataset-upload" },
              ].map((s) => (
                <li key={s.step} className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                    {s.step}
                  </span>
                  <span className="pt-0.5">
                    {s.link ? <Link to={s.link} className="text-primary hover:underline">{s.text}</Link> : s.text}
                  </span>
                </li>
              ))}
            </ol>
          </GlassCard>
        </div>
      </div>
    </PageContainer>
  );
};

export default DatasetsPage;
