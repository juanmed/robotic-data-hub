import { useState, useEffect, useCallback } from "react";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import CreateUploadKeyModal from "@/components/CreateUploadKeyModal";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Key,
  Copy,
  Check,
  Ban,
  Terminal,
  Upload,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { listUploadKeys, createUploadKey, revokeUploadKey } from "@/services/uploadKeyService";
import type { UploadKey } from "@/types";

const UploadKeysPage = () => {
  const [keys, setKeys] = useState<UploadKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    const data = await listUploadKeys();
    setKeys(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async (name: string): Promise<string | null> => {
    const { key, rawKey } = await createUploadKey(name);
    setKeys((prev) => [key, ...prev]);
    return rawKey;
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await revokeUploadKey(id);
      setKeys((prev) =>
        prev.map((k) =>
          k.id === id ? { ...k, active: false, revoked_at: new Date().toISOString() } : k
        )
      );
    } catch (err) {
      console.error("Failed to revoke:", err);
    } finally {
      setRevoking(null);
    }
  };

  const handleCopyPrefix = (id: string, prefix: string) => {
    navigator.clipboard.writeText(prefix);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeKeys = keys.filter((k) => k.active);
  const revokedKeys = keys.filter((k) => !k.active);

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader
            title="Upload Keys"
            subtitle="Generate keys for CLI-based dataset uploads to GamiphyAI."
          />

          {/* Warning banner */}
          <div className="flex items-start gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-5 py-4">
            <ShieldAlert className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
            <p className="text-xs text-secondary leading-relaxed">
              Upload keys grant write access to your datasets. Keep them secure — never share them
              publicly or commit them to source control.
            </p>
          </div>

          {/* Create button */}
          <Button variant="neon" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Upload Key
          </Button>

          {/* Loading skeleton */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            /* Empty state */
            <GlassCard hover={false} className="text-center py-16">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No upload keys yet</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                Create an upload key to start pushing datasets from your command line.
              </p>
              <Button variant="neon" size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create your first key
              </Button>
            </GlassCard>
          ) : (
            <div className="space-y-6">
              {/* Active keys */}
              {activeKeys.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Active Keys ({activeKeys.length})
                  </p>
                  {activeKeys.map((k) => (
                    <KeyRow
                      key={k.id}
                      uploadKey={k}
                      copiedId={copiedId}
                      revoking={revoking}
                      onCopy={handleCopyPrefix}
                      onRevoke={handleRevoke}
                    />
                  ))}
                </div>
              )}

              {/* Revoked keys */}
              {revokedKeys.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Revoked Keys ({revokedKeys.length})
                  </p>
                  {revokedKeys.map((k) => (
                    <KeyRow
                      key={k.id}
                      uploadKey={k}
                      copiedId={copiedId}
                      revoking={revoking}
                      onCopy={handleCopyPrefix}
                      onRevoke={handleRevoke}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CLI instructions sidebar */}
        <div className="space-y-4">
          <GlassCard hover={false} className="border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">CLI Upload</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Use the GamiphyAI CLI to upload datasets directly from your terminal. Install the
              uploader from your LeRobot fork, then run:
            </p>
            <div className="rounded-xl bg-background/80 border border-border/30 p-4 font-mono text-[11px] text-primary leading-relaxed overflow-x-auto">
              <span className="text-muted-foreground">$</span> lerobot_gamiphy_upload \{"\n"}
              {"  "}--repo_id user/dataset
            </div>
          </GlassCard>

          {/* API Reference card */}
          <GlassCard hover={false} className="border-secondary/20">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-semibold text-foreground">API Reference</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Initialize a dataset upload session by calling the backend function:
            </p>
            <div className="rounded-xl bg-background/80 border border-border/30 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto space-y-2">
              <div>
                <span className="text-secondary">POST</span>{" "}
                <span className="text-foreground">https://api.gamiphy.ai/functions/v1/init-dataset-upload</span>
              </div>
              <div className="text-muted-foreground">Authorization: Bearer &lt;upload_key&gt;</div>
              <div className="border-t border-border/30 pt-2 mt-2">
                <span className="text-muted-foreground">{"{"}</span>{"\n"}
                {"  "}<span className="text-primary">"dataset_name"</span>: <span className="text-foreground">"my_dataset"</span>,{"\n"}
                {"  "}<span className="text-primary">"source_format"</span>: <span className="text-foreground">"lerobot"</span>,{"\n"}
                {"  "}<span className="text-primary">"files"</span>: [{"\n"}
                {"    "}{"{"} <span className="text-primary">"relative_path"</span>: <span className="text-foreground">"meta/info.json"</span>,{"\n"}
                {"      "}<span className="text-primary">"size_bytes"</span>: <span className="text-foreground">1234</span> {"}"}{"\n"}
                {"  "}]{"\n"}
                <span className="text-muted-foreground">{"}"}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Returns <code className="text-primary">dataset_id</code> and signed upload URLs for each file.
            </p>
          </GlassCard>

          <GlassCard hover={false} className="border-border/30">
            <h3 className="text-sm font-semibold text-foreground mb-2">Key Lifecycle</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                Keys are hashed and stored securely — the raw key is shown only once.
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                Revoking a key is immediate and permanent.
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                Last-used timestamps update when the CLI authenticates.
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>

      <CreateUploadKeyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreate}
      />
    </PageContainer>
  );
};

/* ── Key Row ─────────────────────────────────────────────────── */

interface KeyRowProps {
  uploadKey: UploadKey;
  copiedId: string | null;
  revoking: string | null;
  onCopy: (id: string, prefix: string) => void;
  onRevoke: (id: string) => void;
}

const KeyRow = ({ uploadKey: k, copiedId, revoking, onCopy, onRevoke }: KeyRowProps) => (
  <GlassCard hover={false} className={`flex items-center justify-between gap-4 ${!k.active ? "opacity-50" : ""}`}>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1.5">
        <Key className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-medium text-foreground">{k.name}</span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            k.active
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {k.active ? "Active" : "Revoked"}
        </span>
      </div>
      <div className="rounded-lg bg-background/80 border border-border/30 px-3 py-2 font-mono text-xs text-muted-foreground tracking-wider w-fit">
        {k.key_prefix}
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
        {k.last_used_at && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last used {new Date(k.last_used_at).toLocaleDateString()}
          </span>
        )}
        {k.revoked_at && <span>Revoked {new Date(k.revoked_at).toLocaleDateString()}</span>}
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => onCopy(k.id, k.key_prefix)}
        title="Copy prefix"
      >
        {copiedId === k.id ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      </Button>
      {k.active && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:text-destructive"
          onClick={() => onRevoke(k.id)}
          disabled={revoking === k.id}
          title="Revoke key"
        >
          <Ban className="h-4 w-4" />
        </Button>
      )}
    </div>
  </GlassCard>
);

export default UploadKeysPage;
