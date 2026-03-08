import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock, CheckCircle2, Loader2 } from "lucide-react";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  priceCents: number;
}

const CheckoutModal = ({ open, onClose, onConfirm, title, priceCents }: CheckoutModalProps) => {
  const [step, setStep] = useState<"form" | "processing" | "done">("form");

  const handleConfirm = async () => {
    setStep("processing");
    await onConfirm();
    setStep("done");
  };

  const handleClose = () => {
    setStep("form");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-secondary" />
                Checkout
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Complete your purchase for <span className="text-foreground font-medium">{title}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Price summary */}
              <div className="rounded-xl border border-border/40 bg-background/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Dataset</span>
                  <span className="text-xs text-foreground">{title}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-sm font-bold text-secondary shadow-[0_0_8px_hsl(var(--secondary)/0.4)]">
                    ${(priceCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Fake card form */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                    Card Number
                  </label>
                  <input
                    type="text"
                    defaultValue="4242 4242 4242 4242"
                    className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm font-mono text-foreground focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-colors"
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                      Expiry
                    </label>
                    <input
                      type="text"
                      defaultValue="12/28"
                      className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm font-mono text-foreground focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-colors"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                      CVC
                    </label>
                    <input
                      type="text"
                      defaultValue="123"
                      className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm font-mono text-foreground focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-colors"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                This is a mock checkout — no real payment will be processed.
              </p>

              <Button
                variant="neon"
                className="w-full gap-2"
                onClick={handleConfirm}
              >
                <CreditCard className="h-4 w-4" />
                Pay ${(priceCents / 100).toFixed(2)}
              </Button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 text-secondary animate-spin mb-4" />
            <p className="text-sm text-foreground font-medium">Processing payment...</p>
            <p className="text-[10px] text-muted-foreground mt-1">This will only take a moment</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Purchase Complete!</p>
            <p className="text-[11px] text-muted-foreground mb-6">
              You now have access to this dataset.
            </p>
            <Button variant="neon-outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
