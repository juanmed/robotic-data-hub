import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReAuthModal from "@/components/ReAuthModal";
import PaymentElementModal from "@/components/PaymentElementModal";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, CreditCard, Loader2, RotateCcw } from "lucide-react";

type State = "locked" | "authenticating" | "loading" | "no_card" | "ready" | "updating" | "error";

interface PaymentInfo {
  hasPaymentMethod: boolean;
  card?: {
    last4: string;
    brand: string;
    exp_month: number;
    exp_year: number;
  };
  billing?: {
    name: string;
    country: string;
    postal_code: string;
  };
  charges?: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    created: number;
  }>;
}

const PaymentInfoTab = () => {
  const { user } = useAuth();
  const [state, setState] = useState<State>("locked");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState("");
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [showBillingName, setShowBillingName] = useState(false);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [showPaymentElementModal, setShowPaymentElementModal] = useState(false);
  const [paymentElementMode, setPaymentElementMode] = useState<"add" | "update">("add");
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Session timeout with broad activity tracking
  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 5 minutes = 300000 ms (use shorter timeout for testing purposes)
    timeoutRef.current = setTimeout(() => {
      if (state !== "locked") {
        setState("locked");
        setPaymentInfo(null);
        setShowBillingName(false);
        setSessionVersion((v) => v + 1);
        toast("Session expired. Please re-authenticate.", { icon: "🔒" });
      }
    }, 300000);
  }, [state]);

  // Set up activity listeners
  useEffect(() => {
    if (state === "locked" || state === "authenticating") {
      return;
    }

    const container = containerRef.current;
    const events = ["mousemove", "keydown", "scroll", "touchstart"];

    const handleActivity = () => {
      resetTimeout();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setSessionVersion((v) => v + 1); // Clear state on page hide
        setState("locked");
      }
    };

    events.forEach((event) => {
      container?.addEventListener(event, handleActivity);
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial timeout on entering ready/no_card state
    resetTimeout();

    return () => {
      events.forEach((event) => {
        container?.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, resetTimeout]);

  const handleViewPaymentInfo = () => {
    setState("authenticating");
    setShowReAuthModal(true);
  };

  const handleReAuthSuccess = async () => {
    setState("loading");
    setShowReAuthModal(false);
    setError("");
    const currentVersion = sessionVersion;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;

      if (!jwt) {
        throw new Error("No session");
      }

      const response = await supabase.functions.invoke("get-payment-info", {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      // Discard if session expired
      if (currentVersion !== sessionVersion) return;

      if (response.error) {
        throw new Error(response.error.message || "Failed to fetch payment info");
      }

      const data: PaymentInfo = response.data;
      setPaymentInfo(data);

      if (data.hasPaymentMethod) {
        setState("ready");
      } else {
        setState("no_card");
      }
    } catch (err) {
      if (currentVersion === sessionVersion) {
        setError(err instanceof Error ? err.message : "Failed to load payment info");
        setState("error");
      }
    }
  };

  const handleRetry = () => {
    setError("");
    handleReAuthSuccess();
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentElementModal(false);
    toast("Payment method saved successfully", { icon: "✓" });
    // Refetch payment info
    await handleReAuthSuccess();
  };

  const handleAddPaymentMethod = () => {
    setPaymentElementMode("add");
    setShowPaymentElementModal(true);
  };

  const handleUpdatePaymentMethod = () => {
    setPaymentElementMode("update");
    setShowPaymentElementModal(true);
  };

  const maskBillingName = (name: string) => {
    if (!name || name.length < 2) return name;
    return name[0] + "•".repeat(Math.max(0, name.length - 2)) + name[name.length - 1];
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Locked state
  if (state === "locked") {
    return (
      <div ref={containerRef} className="w-full max-w-2xl">
        <GlassCard hover={false}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm mb-4">
              View and manage your payment methods securely
            </p>
            <Button onClick={handleViewPaymentInfo}>
              View payment info
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Authenticating state
  if (state === "authenticating") {
    return (
      <div ref={containerRef} className="w-full max-w-2xl">
        <ReAuthModal
          open={showReAuthModal}
          onOpenChange={setShowReAuthModal}
          onSuccess={handleReAuthSuccess}
        />
        <GlassCard hover={false}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </GlassCard>
      </div>
    );
  }

  // Loading state
  if (state === "loading") {
    return (
      <div ref={containerRef} className="w-full max-w-2xl">
        <GlassCard hover={false}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </GlassCard>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div ref={containerRef} className="w-full max-w-2xl">
        <GlassCard hover={false}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // No card state
  if (state === "no_card") {
    return (
      <div ref={containerRef} className="w-full max-w-2xl">
        <GlassCard hover={false}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm mb-4">
              No payment method on file
            </p>
            <Button onClick={handleAddPaymentMethod}>
              Add payment method
            </Button>
          </div>
        </GlassCard>
        <PaymentElementModal
          open={showPaymentElementModal}
          onOpenChange={setShowPaymentElementModal}
          onSuccess={handlePaymentSuccess}
          mode={paymentElementMode}
          sessionVersion={sessionVersion}
        />
      </div>
    );
  }

  // Ready state
  return (
    <div ref={containerRef} className="w-full max-w-2xl">
      <GlassCard hover={false}>
        <div className="space-y-6">
          {/* Card Info Section */}
          {paymentInfo?.card && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Payment Method</h3>

              {/* Card Display */}
              <div className="rounded-xl border border-border/30 bg-background/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      •••• •••• •••• {paymentInfo.card.last4}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {paymentInfo.card.brand}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Expires {paymentInfo.card.exp_month}/{paymentInfo.card.exp_year}
                </div>
              </div>

              {/* Billing Info */}
              {paymentInfo.billing && (
                <div className="rounded-xl border border-border/30 bg-background/50 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Name
                        </p>
                        <p className="text-sm text-foreground">
                          {showBillingName
                            ? paymentInfo.billing.name
                            : maskBillingName(paymentInfo.billing.name)}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowBillingName(!showBillingName)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showBillingName ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Country
                        </p>
                        <p className="text-sm text-foreground">
                          {paymentInfo.billing.country}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Postal Code
                        </p>
                        <p className="text-sm text-foreground">
                          {paymentInfo.billing.postal_code}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transaction History */}
          {paymentInfo?.charges && paymentInfo.charges.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Recent Transactions</h3>
              <div className="space-y-2">
                {paymentInfo.charges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-background/50 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {charge.description || "Payment"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(charge.created)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium">
                        {formatCurrency(charge.amount, charge.currency)}
                      </p>
                      <Badge
                        variant={
                          charge.status === "succeeded"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {charge.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button onClick={handleUpdatePaymentMethod} className="w-full">
            Update payment method
          </Button>
        </div>
      </GlassCard>
      <PaymentElementModal
        open={showPaymentElementModal}
        onOpenChange={setShowPaymentElementModal}
        onSuccess={handlePaymentSuccess}
        mode={paymentElementMode}
        sessionVersion={sessionVersion}
      />
    </div>
  );
};

export default PaymentInfoTab;
