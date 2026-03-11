import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { Database, FileText, Clock, CheckCircle2, AlertTriangle, Upload, Loader2, ChevronRight, Terminal } from "lucide-react";
import { listDatasets } from "@/services/datasetService";
import type { Dataset } from "@/types";

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  draft: { icon: FileText, label: "Draft", className: "bg-muted/20 text-muted-foreground border-border/30" },
  uploading: { icon: Upload, label: "Uploading", className: "bg-secondary/10 text-secondary border-secondary/20" },
  ready: { icon: CheckCircle2, label: "Ready", className: "bg-primary/10 text-primary border-primary/20" },
  failed: { icon: AlertTriangle, label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const DatasetsPage = () => {
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
      <div className="space-y-6 max-w-4xl">
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
              <a href="/dashboard/upload-keys" className="text-primary hover:underline">Upload Keys</a>{" "}
              to get started.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {datasets.map((ds) => {
              const sc = statusConfig[ds.status] || statusConfig.draft;
              const StatusIcon = sc.icon;
              return (
                <GlassCard key={ds.id} hover={false} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{ds.name}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${sc.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-1.5">
                      <span>Format: {ds.source_format}</span>
                      <span>{ds.file_count} file{ds.file_count !== 1 ? "s" : ""}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ds.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default DatasetsPage;
