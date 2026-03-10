import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Copy, Trash2, Key, AlertTriangle, Check, User, Mail,
  Terminal, Shield, Eye, EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // API Keys state
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRawKey, setShowRawKey] = useState(false);

  // Fetch keys
  useEffect(() => {
    const fetchKeys = async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, created_at")
        .order("created_at", { ascending: false });
      if (!error && data) setKeys(data);
      setKeysLoading(false);
    };
    fetchKeys();
  }, []);

  const handleCreate = useCallback(async () => {
    if (!newKeyName.trim() || creating) return;
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("generate-api-key", {
        body: { name: newKeyName.trim() },
      });
      if (res.error) throw new Error(res.error.message);
      const { raw_key, ...keyRow } = res.data;
      setKeys((prev) => [keyRow, ...prev]);
      setNewlyCreatedKey(raw_key);
      setNewKeyName("");
      setShowCreate(false);
      setShowRawKey(true);
      toast({ title: "API key created", description: "Copy it now — it won't be shown again." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }, [newKeyName, creating, toast]);

  const handleRevoke = useCallback(async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast({ title: "Key revoked" });
    }
  }, [toast]);

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <PageContainer>
      <SectionHeader title="Profile" subtitle="Manage your account and API keys." />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/30 border border-border/40">
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-1.5"><Key className="h-3.5 w-3.5" />API Keys</TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile">
          <GlassCard hover={false} className="max-w-xl">
            <div className="flex items-center gap-5 mb-6">
              <Avatar className="h-16 w-16 text-lg border-2 border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{user?.name || "—"}</h2>
                <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 px-4 py-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</p>
                  <p className="text-sm text-foreground">{user?.name || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 px-4 py-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">{user?.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 px-4 py-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email Verified</p>
                  <p className="text-sm text-foreground">{user?.email_verified ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* ── API Keys Tab ── */}
        <TabsContent value="api-keys" className="space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-5 py-4">
            <AlertTriangle className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
            <p className="text-xs text-secondary leading-relaxed">
              API keys grant full upload access to your account. Keep them secret — do not share them publicly or commit them to source control. <strong>Keys are shown only once</strong> at creation time.
            </p>
          </div>

          {/* Newly created key banner */}
          {newlyCreatedKey && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 space-y-2">
              <p className="text-sm font-medium text-primary">🔑 New key created — copy it now!</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-background/80 border border-border/30 px-4 py-2.5 font-mono text-xs text-primary tracking-wider break-all select-all">
                  {showRawKey ? newlyCreatedKey : "•".repeat(newlyCreatedKey.length)}
                </code>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowRawKey(!showRawKey)}>
                  {showRawKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => handleCopy("new", newlyCreatedKey)}>
                  {copiedId === "new" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">This key will not be shown again after you leave this page.</p>
              <Button variant="ghost" size="sm" className="mt-1" onClick={() => setNewlyCreatedKey(null)}>Dismiss</Button>
            </div>
          )}

          {/* Create form */}
          {showCreate ? (
            <GlassCard hover={false}>
              <p className="text-sm font-medium text-foreground mb-3">Create new API key</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Production CLI)"
                  maxLength={50}
                  className="flex-1 rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <Button variant="neon" onClick={handleCreate} disabled={!newKeyName.trim() || creating}>
                  {creating ? "Generating…" : "Generate"}
                </Button>
                <Button variant="ghost" onClick={() => { setShowCreate(false); setNewKeyName(""); }}>Cancel</Button>
              </div>
            </GlassCard>
          ) : (
            <Button variant="neon" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Generate API Key
            </Button>
          )}

          {/* Keys list */}
          {keysLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted/20 animate-pulse" />)}
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
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium text-foreground">{k.name}</span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{k.key_prefix}••••••••</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Created {new Date(k.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRevoke(k.id)}
                    className="h-9 w-9 hover:text-destructive shrink-0"
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </GlassCard>
              ))}
            </div>
          )}

          {/* CLI Upload Instructions */}
          <GlassCard hover={false} className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">CLI Upload Instructions</h3>
            </div>
            <div className="space-y-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">1. Set your API key</p>
                <pre className="rounded-lg bg-background/80 border border-border/30 px-4 py-3 font-mono text-primary overflow-x-auto select-all">
                  export GAMIPHYAI_API_KEY="gpai_your_key_here"
                </pre>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">2. Upload a dataset</p>
                <pre className="rounded-lg bg-background/80 border border-border/30 px-4 py-3 font-mono text-primary overflow-x-auto select-all">
{`curl -X POST https://api.gamiphyai.com/v1/datasets/upload \\
  -H "Authorization: Bearer $GAMIPHYAI_API_KEY" \\
  -F "file=@my_dataset.zip" \\
  -F "name=my-robot-dataset"`}
                </pre>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">3. List your datasets</p>
                <pre className="rounded-lg bg-background/80 border border-border/30 px-4 py-3 font-mono text-primary overflow-x-auto select-all">
{`curl https://api.gamiphyai.com/v1/datasets \\
  -H "Authorization: Bearer $GAMIPHYAI_API_KEY"`}
                </pre>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default ProfilePage;
