import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ShieldAlert, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => Promise<string | null>;
}

const CreateUploadKeyModal = ({ open, onClose, onCreated }: Props) => {
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    try {
      const key = await onCreated(name.trim());
      if (key) setRawKey(key);
    } catch (err: any) {
      setError(err.message || "Failed to create key");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!rawKey) return;
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setName("");
    setRawKey(null);
    setCopied(false);
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-[0_0_80px_hsl(var(--neon-purple)/0.15)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            {rawKey ? "Upload Key Created" : "Create Upload Key"}
          </h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {rawKey ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/5 px-4 py-3">
              <ShieldAlert className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
              <p className="text-xs text-secondary leading-relaxed">
                This key is shown only once. Copy and store it securely. You will not be able to see it again.
              </p>
            </div>

            <div className="relative group">
              <div className="rounded-xl border border-primary/30 bg-background/80 p-4 font-mono text-sm text-primary break-all select-all shadow-[inset_0_0_30px_hsl(var(--primary)/0.05)]">
                {rawKey}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Button variant="neon" className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Key Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. "My laptop uploader"'
                maxLength={60}
                className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button variant="neon" className="flex-1" onClick={handleCreate} disabled={!name.trim() || loading}>
                {loading ? "Creating..." : "Create Key"}
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateUploadKeyModal;
