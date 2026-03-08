import { useState, useEffect, useCallback } from "react";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2, Key, AlertTriangle, Check } from "lucide-react";

interface MockKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

const generateMockKey = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "gpai_";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const APIKeysPage = () => {
  const [keys, setKeys] = useState<MockKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeys([
        { id: "key_001", name: "Production Key", key: "gpai_83KDJDKS92JD", created_at: "2026-02-01T00:00:00Z" },
        { id: "key_002", name: "Development Key", key: "gpai_7FN29XKWP4QL", created_at: "2026-03-01T00:00:00Z" },
      ]);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = useCallback(() => {
    if (!newKeyName.trim()) return;
    const newKey: MockKey = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      key: generateMockKey(),
      created_at: new Date().toISOString(),
    };
    setKeys((prev) => [newKey, ...prev]);
    setNewKeyName("");
    setShowCreate(false);
  }, [newKeyName]);

  const handleDelete = useCallback((id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const handleCopy = useCallback((id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <PageContainer>
      <SectionHeader title="API Keys" subtitle="Manage your API keys for programmatic access." />

      {/* Warning */}
      <div className="mb-8 flex items-start gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-5 py-4">
        <AlertTriangle className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
        <p className="text-xs text-secondary leading-relaxed">
          API keys are required for uploading and downloading datasets. Keep your keys secure — do not share them publicly or commit them to source control.
        </p>
      </div>

      {/* Create button / form */}
      {showCreate ? (
        <GlassCard className="mb-6" hover={false}>
          <p className="text-sm font-medium text-foreground mb-3">Create new API key</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. Production)"
              maxLength={50}
              className="flex-1 rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button variant="neon" size="default" onClick={handleCreate} disabled={!newKeyName.trim()}>
              Generate
            </Button>
            <Button variant="ghost" size="default" onClick={() => { setShowCreate(false); setNewKeyName(""); }}>
              Cancel
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="mb-6">
          <Button variant="neon" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Generate API Key
          </Button>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted/20 animate-pulse" />)}
        </div>
      ) : keys.length === 0 ? (
        <GlassCard hover={false} className="text-center py-12">
          <Key className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No API keys yet. Create one to get started.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <GlassCard key={k.id} hover={false} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{k.name}</span>
                </div>
                <div className="rounded-lg bg-background/80 border border-border/30 px-4 py-2.5 font-mono-code text-xs text-primary tracking-wider select-all">
                  {k.key}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Created {new Date(k.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(k.id, k.key)}
                  className="h-9 w-9"
                  title="Copy key"
                >
                  {copiedId === k.id ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(k.id)}
                  className="h-9 w-9 hover:text-destructive"
                  title="Delete key"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default APIKeysPage;
