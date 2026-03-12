import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Database, FileText, Clock, CheckCircle2, AlertTriangle,
  Upload, Loader2, Eye, Folder, File, Download, ExternalLink,
} from "lucide-react";
import { getDataset, getDatasetFiles, getDatasetFileUrls } from "@/services/datasetService";
import { openVisualizer } from "@/lib/visualizer";
import { toast } from "sonner";
import type { Dataset, DatasetFile } from "@/types";
import type { SignedFileUrl } from "@/services/datasetService";

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string; vizMessage: string }> = {
  uploading: { icon: Upload, label: "Uploading", className: "bg-secondary/10 text-secondary border-secondary/20", vizMessage: "Upload in progress" },
  ready: { icon: CheckCircle2, label: "Ready", className: "bg-primary/10 text-primary border-primary/20", vizMessage: "Dataset is ready for visualization" },
  failed: { icon: AlertTriangle, label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20", vizMessage: "Dataset processing failed" },
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const DatasetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [files, setFiles] = useState<DatasetFile[]>([]);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visualizing, setVisualizing] = useState(false);

  const handleVisualize = async () => {
    if (!dataset) return;
    setVisualizing(true);
    try {
      await openVisualizer(dataset.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to open visualizer");
    } finally {
      setVisualizing(false);
    }
  };

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [ds, fs] = await Promise.all([getDataset(id), getDatasetFiles(id)]);
      if (!ds) { setError("Dataset not found"); return; }
      setDataset(ds);
      setFiles(fs);
    } catch (err: any) {
      setError(err.message || "Failed to load dataset");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const fetchUrls = useCallback(async () => {
    if (!id || !dataset || dataset.status !== "ready") return;
    const uploaded = files.filter((f) => f.upload_status === "uploaded");
    if (uploaded.length === 0) return;
    setLoadingUrls(true);
    try {
      const urls = await getDatasetFileUrls(id);
      const map: Record<string, string> = {};
      urls.forEach((u) => { if (u.signed_url) map[u.relative_path] = u.signed_url; });
      setFileUrls(map);
    } catch {
      // silent
    } finally {
      setLoadingUrls(false);
    }
  }, [id, dataset, files]);

  useEffect(() => { fetchUrls(); }, [fetchUrls]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (error || !dataset) {
    return (
      <PageContainer>
        <GlassCard hover={false} className="text-center py-12 max-w-lg mx-auto">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <p className="text-sm text-destructive mb-4">{error || "Dataset not found"}</p>
          <Link to="/dashboard/datasets">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Datasets</Button>
          </Link>
        </GlassCard>
      </PageContainer>
    );
  }

  const sc = statusConfig[dataset.status] || statusConfig.uploading;
  const StatusIcon = sc.icon;
  const uploadedCount = files.filter((f) => f.upload_status === "uploaded").length;
  const isReady = dataset.status === "ready";

  return (
    <PageContainer>
      <div className="max-w-5xl space-y-6">
        {/* Back nav */}
        <Link to="/dashboard/datasets" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Datasets
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Database className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">{dataset.display_name}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${sc.className}`}>
                <StatusIcon className="h-3 w-3" />
                {sc.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              {dataset.source_repo_id && <span>Repo: {dataset.source_repo_id}</span>}
              <span>{files.length} file{files.length !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Created {new Date(dataset.created_at).toLocaleDateString()}</span>
              {dataset.confirmed_at && <span>Confirmed {new Date(dataset.confirmed_at).toLocaleDateString()}</span>}
            </div>
          </div>

          {/* Visualize button in header */}
          <Button
            disabled={!isReady}
            onClick={() => openVisualizer(dataset.id)}
            className={`transition-all ${
              isReady
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.6)]"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualize Dataset
            <ExternalLink className="h-3 w-3 ml-1.5 opacity-60" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File list */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Files ({uploadedCount}/{files.length} uploaded)</h2>

            {files.length === 0 ? (
              <GlassCard hover={false} className="text-center py-10">
                <Folder className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No files registered for this dataset.</p>
              </GlassCard>
            ) : (
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
                  <span>Path</span>
                  <span>Size</span>
                  <span>Type</span>
                  <span>Status</span>
                  <span></span>
                </div>
                <div className="divide-y divide-border/20">
                  {files.map((f) => (
                    <div key={f.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 py-3 items-center hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-foreground font-mono truncate">{f.relative_path}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatBytes(f.size_bytes)}</span>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{f.content_type || "—"}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        f.upload_status === "uploaded"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted/20 text-muted-foreground border-border/30"
                      }`}>
                        {f.upload_status}
                      </span>
                      <div className="flex items-center gap-1">
                        {fileUrls[f.relative_path] && (
                          <a href={fileUrls[f.relative_path]} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {f.content_type?.startsWith("video/") ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Visualization card */}
            <GlassCard hover={false} className={`border ${
              isReady ? "border-primary/30" : dataset.status === "failed" ? "border-destructive/30" : "border-secondary/30"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Visualization</h3>
              </div>
              <div className={`rounded-xl px-4 py-6 text-center ${
                isReady
                  ? "bg-primary/5 border border-primary/20"
                  : dataset.status === "failed"
                  ? "bg-destructive/5 border border-destructive/20"
                  : "bg-secondary/5 border border-secondary/20"
              }`}>
                {!isReady && dataset.status === "uploading" && (
                  <Loader2 className="h-8 w-8 mx-auto mb-2 text-secondary animate-spin" />
                )}
                {(isReady || dataset.status === "failed") && (
                  <StatusIcon className={`h-8 w-8 mx-auto mb-2 ${
                    isReady ? "text-primary" : "text-destructive"
                  }`} />
                )}
                <p className={`text-xs font-medium ${
                  isReady ? "text-primary" : dataset.status === "failed" ? "text-destructive" : "text-secondary"
                }`}>
                  {sc.vizMessage}
                </p>
              </div>
              <Button
                disabled={!isReady}
                onClick={() => openVisualizer(dataset.id)}
                className={`w-full mt-3 transition-all ${
                  isReady
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.6)]"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isReady ? "Open Visualizer" : "Not Available"}
                {isReady && <ExternalLink className="h-3 w-3 ml-1.5 opacity-60" />}
              </Button>
            </GlassCard>

            {/* CLI Upload Flow */}
            <GlassCard hover={false} className="border-border/30">
              <h3 className="text-sm font-semibold text-foreground mb-3">CLI Upload Flow</h3>
              <ol className="space-y-3 text-xs text-muted-foreground">
                {[
                  { step: "1", text: "Create an upload key", color: "bg-primary" },
                  { step: "2", text: "Call init-dataset-upload", color: "bg-secondary" },
                  { step: "3", text: "Upload files to signed URLs", color: "bg-secondary" },
                  { step: "4", text: "Call finalize-dataset-upload", color: "bg-primary" },
                ].map((s) => (
                  <li key={s.step} className="flex items-start gap-2.5">
                    <span className={`flex items-center justify-center h-5 w-5 rounded-full ${s.color} text-[10px] font-bold text-primary-foreground shrink-0`}>
                      {s.step}
                    </span>
                    <span className="pt-0.5">{s.text}</span>
                  </li>
                ))}
              </ol>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default DatasetDetailPage;
