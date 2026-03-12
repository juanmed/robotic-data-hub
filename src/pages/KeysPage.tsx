import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import CreateUploadKeyModal from "@/components/CreateUploadKeyModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { listUploadKeys, createUploadKey, revokeUploadKey } from "@/services/uploadKeyService";
import type { UploadKey } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Key, KeyRound, Upload, Plus, Copy, Check, Trash2, Ban,
  AlertTriangle, ShieldAlert, Terminal, Eye, EyeOff, Clock,
} from "lucide-react";

/* ── API Key types ── */
interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
}

const KeysPage = () => {
  const { toast } = useToast();

  /* ── API Keys state ── */
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [showApiCreate, setShowApiCreate] = useState(false);
  const [apiCreating, setApiCreating] = useState(false);
  const [newlyCreatedApiKey, setNewlyCreatedApiKey] = useState<string | null>(null);
  const [showRawApiKey, setShowRawApiKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* ── Upload Keys state ── */
  const [uploadKeys, setUploadKeys] = useState<UploadKey[]>([]);
  const [uploadLoading, setUploadLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  /* ── Fetch API Keys ── */
  useEffect(() => {
    const fetchApiKeys = async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, created_at")
        .order("created_at", { ascending: false });
      if (!error && data) setApiKeys(data);
      setApiLoading(false);
    };
    fetchApiKeys();
  }, []);

  /* ── Fetch Upload Keys ── */
  useEffect(() => {
    const fetch = async () => {
      setUploadLoading(true);
      const data = await listUploadKeys();
      setUploadKeys(data);
      setUploadLoading(false);
    };
    fetch();
  }, []);

  /* ── API Key handlers ── */
  const handleCreateApiKey = useCallback(async () => {
    if (!newApiKeyName.trim() || apiCreating) return;
    setApiCreating(true);
    try {
      const res = await supabase.functions.invoke("generate-api-key", {
        body: { name: newApiKeyName.trim() },
      });
      if (res.error) throw new Error(res.error.message);
      const { raw_key, ...keyRow } = res.data;
      setApiKeys((prev) => [keyRow, ...prev]);
      setNewlyCreatedApiKey(raw_key);
      setNewApiKeyName("");
      setShowApiCreate(false);
      setShowRawApiKey(true);
      toast({ title: "API key created", description: "Copy it now — it won't be shown again." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setApiCreating(false);
    }
  }, [newApiKeyName, apiCreating, toast]);

  const handleRevokeApiKey = useCallback(async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      toast({ title: "Key revoked" });
    }
  }, [toast]);

  /* ── Upload Key handlers ── */
  const handleCreateUploadKey = async (name: string): Promise<string | null> => {
    const { key, rawKey } = await createUploadKey(name);
    setUploadKeys((prev) => [key, ...prev]);
    return rawKey;
  };

  const handleRevokeUploadKey = async (id: string) => {
    setRevoking(id);
    try {
      await revokeUploadKey(id);
      setUploadKeys((prev) =>
        prev.map((k) => k.id === id ? { ...k, active: false, revoked_at: new Date().toISOString() } : k)
      );
    } catch (err) {
      console.error("Failed to revoke:", err);
    } finally {
      setRevoking(null);
    }
  };

  /* ── Utils ── */
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeUploadKeys = uploadKeys.filter((k) => k.active);
  const revokedUploadKeys = uploadKeys.filter((k) => !k.active);

  return (
    <PageContainer>
      <SectionHeader title="Keys" subtitle="Manage your API keys and upload keys." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="api-keys" className="space-y-6">
            <TabsList className="bg-muted/30 border border-border/40">
              <TabsTrigger value="api-keys" className="gap-1.5"><Key className="h-3.5 w-3.5" />API Keys</TabsTrigger>
              <TabsTrigger value="upload-keys" className="gap-1.5"><Upload className="h-3.5 w-3.5" />Upload Keys</TabsTrigger>
            </TabsList>

            {/* ── API Keys Tab ── */}
            <TabsContent value="api-keys" className="space-y-6">
              <div className="flex items-start gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-5 py-4">
                <AlertTriangle className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                <p className="text-xs text-secondary leading-relaxed">
                  API keys grant full upload access to your account. Keep them secret — do not share them publicly or commit them to source control. <strong>Keys are shown only once</strong> at creation time.
                </p>
              </div>

              {newlyCreatedApiKey && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 space-y-2">
                  <p className="text-sm font-medium text-primary">🔑 New key created — copy it now!</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-background/80 border border-border/30 px-4 py-2.5 font-mono text-xs text-primary tracking-wider break-all select-all">
                      {showRawApiKey ? newlyCreatedApiKey : "•".repeat(newlyCreatedApiKey.length)}
                    </code>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowRawApiKey(!showRawApiKey)}>
                      {showRawApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => handleCopy("new-api", newlyCreatedApiKey)}>
                      {copiedId === "new-api" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">This key will not be shown again after you leave this page.</p>
                  <Button variant="ghost" size="sm" className="mt-1" onClick={() => setNewlyCreatedApiKey(null)}>Dismiss</Button>
                </div>
              )}

              {showApiCreate ? (
                <GlassCard hover={false}>
                  <p className="text-sm font-medium text-foreground mb-3">Create new API key</p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                      placeholder="Key name (e.g. Production CLI)"
                      maxLength={50}
                      className="flex-1 rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                      onKeyDown={(e) => e.key === "Enter" && handleCreateApiKey()}
                    />
                    <Button variant="neon" onClick={handleCreateApiKey} disabled={!newApiKeyName.trim() || apiCreating}>
                      {apiCreating ? "Generating…" : "Generate"}
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowApiCreate(false); setNewApiKeyName(""); }}>Cancel</Button>
                  </div>
                </GlassCard>
              ) : (
                <Button variant="neon" size="sm" onClick={() => setShowApiCreate(true)}>
                  <Plus className="h-4 w-4" /> Generate API Key
                </Button>
              )}

              {apiLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted/20 animate-pulse" />)}
                </div>
              ) : apiKeys.length === 0 ? (
                <GlassCard hover={false} className="text-center py-12">
                  <Key className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No API keys yet. Create one to get started.</p>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((k) => (
                    <GlassCard key={k.id} hover={false} className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm font-medium text-foreground">{k.name}</span>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">{k.key_prefix}••••••••</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Created {new Date(k.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRevokeApiKey(k.id)} className="h-9 w-9 hover:text-destructive shrink-0" title="Revoke key">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </GlassCard>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Upload Keys Tab ── */}
            <TabsContent value="upload-keys" className="space-y-6">
              <div className="flex items-start gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-5 py-4">
                <ShieldAlert className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                <p className="text-xs text-secondary leading-relaxed">
                  Upload keys grant write access to your datasets. Keep them secure — never share them publicly or commit them to source control.
                </p>
              </div>

              <Button variant="neon" size="sm" onClick={() => setUploadModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Upload Key
              </Button>

              {uploadLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />)}
                </div>
              ) : uploadKeys.length === 0 ? (
                <GlassCard hover={false} className="text-center py-16">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">No upload keys yet</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                    Create an upload key to start pushing datasets from your command line.
                  </p>
                  <Button variant="neon" size="sm" onClick={() => setUploadModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Create your first key
                  </Button>
                </GlassCard>
              ) : (
                <div className="space-y-6">
                  {activeUploadKeys.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Keys ({activeUploadKeys.length})</p>
                      {activeUploadKeys.map((k) => (
                        <UploadKeyRow key={k.id} uploadKey={k} copiedId={copiedId} revoking={revoking} onCopy={handleCopy} onRevoke={handleRevokeUploadKey} />
                      ))}
                    </div>
                  )}
                  {revokedUploadKeys.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revoked Keys ({revokedUploadKeys.length})</p>
                      {revokedUploadKeys.map((k) => (
                        <UploadKeyRow key={k.id} uploadKey={k} copiedId={copiedId} revoking={revoking} onCopy={handleCopy} onRevoke={handleRevokeUploadKey} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <GlassCard hover={false} className="border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">CLI Upload Flow</h3>
            </div>
            <ol className="space-y-3 text-xs text-muted-foreground">
              {[
                { step: "1", text: "Create an upload key" },
                { step: "2", text: "Call init-dataset-upload" },
                { step: "3", text: "Upload files to signed URLs" },
                { step: "4", text: "Call finalize-dataset-upload" },
              ].map((s) => (
                <li key={s.step} className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">{s.step}</span>
                  <span className="pt-0.5">{s.text}</span>
                </li>
              ))}
            </ol>
          </GlassCard>

          <GlassCard hover={false} className="border-secondary/20">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-semibold text-foreground">API Reference</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Initialize a dataset upload session:
            </p>
            <div className="rounded-xl bg-background/80 border border-border/30 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto space-y-2">
              <div>
                <span className="text-secondary">POST</span>{" "}
                <span className="text-foreground">/functions/v1/init-dataset-upload</span>
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
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onCreated={handleCreateUploadKey}
      />
    </PageContainer>
  );
};

/* ── Upload Key Row ── */
const UploadKeyRow = ({
  uploadKey: k, copiedId, revoking, onCopy, onRevoke,
}: {
  uploadKey: UploadKey;
  copiedId: string | null;
  revoking: string | null;
  onCopy: (id: string, text: string) => void;
  onRevoke: (id: string) => void;
}) => (
  <GlassCard hover={false} className={`flex items-center justify-between gap-4 ${!k.active ? "opacity-50" : ""}`}>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1.5">
        <KeyRound className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-medium text-foreground">{k.name}</span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
          k.active
            ? "bg-primary/10 text-primary border border-primary/20"
            : "bg-destructive/10 text-destructive border border-destructive/20"
        }`}>
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
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onCopy(k.id, k.key_prefix)} title="Copy prefix">
        {copiedId === k.id ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      </Button>
      {k.active && (
        <Button variant="ghost" size="icon" className="h-9 w-9 hover:text-destructive" onClick={() => onRevoke(k.id)} disabled={revoking === k.id} title="Revoke key">
          <Ban className="h-4 w-4" />
        </Button>
      )}
    </div>
  </GlassCard>
);

export default KeysPage;
