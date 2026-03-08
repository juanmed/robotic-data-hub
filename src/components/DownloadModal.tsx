import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Key,
  Download,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Archive,
  AlertCircle,
} from "lucide-react";

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  datasetTitle: string;
}

type Step = "api_key" | "verifying" | "downloading" | "done" | "error";

const DownloadModal = ({ open, onClose, datasetTitle }: DownloadModalProps) => {
  const [step, setStep] = useState<Step>("api_key");
  const [apiKey, setApiKey] = useState("");
  const [progress, setProgress] = useState(0);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("api_key");
      setApiKey("");
      setProgress(0);
    }
  }, [open]);

  const handleVerify = useCallback(async () => {
    if (!apiKey.trim()) return;
    setStep("verifying");

    // Simulate verification
    await new Promise((r) => setTimeout(r, 1200));

    // Accept any key that starts with "gpai_" or has 8+ chars
    if (apiKey.trim().length >= 4) {
      setStep("downloading");
    } else {
      setStep("error");
    }
  }, [apiKey]);

  // Simulate download progress
  useEffect(() => {
    if (step !== "downloading") return;
    setProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      // Accelerating then decelerating curve
      const increment = current < 60 ? Math.random() * 8 + 2 : Math.random() * 3 + 0.5;
      current = Math.min(current + increment, 100);
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep("done"), 400);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        {step === "api_key" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API Key Required
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter your API key to download{" "}
                <span className="text-foreground font-medium">{datasetTitle}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gpai_prod_xxxxxxxxxxxx"
                  className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>

              <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Your key will be verified before the download begins.
              </p>

              <Button
                variant="neon"
                className="w-full gap-2"
                onClick={handleVerify}
                disabled={!apiKey.trim()}
              >
                <ShieldCheck className="h-4 w-4" />
                Verify &amp; Download
              </Button>
            </div>
          </>
        )}

        {step === "verifying" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-sm text-foreground font-medium">Verifying API key...</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Checking permissions and quota
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Invalid API Key</p>
            <p className="text-[11px] text-muted-foreground mb-6">
              Please check your key and try again.
            </p>
            <Button variant="neon-outline" onClick={() => setStep("api_key")}>
              Try Again
            </Button>
          </div>
        )}

        {step === "downloading" && (
          <div className="flex flex-col items-center justify-center py-10 px-2">
            <Archive className="h-10 w-10 text-primary mb-4 animate-pulse" />
            <p className="text-sm font-medium text-foreground mb-1">
              Preparing dataset archive...
            </p>
            <p className="text-[10px] text-muted-foreground mb-6">
              Packaging {datasetTitle}
            </p>

            <div className="w-full space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {progress < 30
                    ? "Collecting files..."
                    : progress < 70
                    ? "Compressing data..."
                    : "Finalizing archive..."}
                </span>
                <span className="font-mono">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Download Ready!</p>
            <p className="text-[11px] text-muted-foreground mb-6">
              Your dataset archive has been prepared.
            </p>
            <Button variant="neon" className="gap-2" onClick={onClose}>
              <Download className="h-4 w-4" />
              Save to Disk
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DownloadModal;
