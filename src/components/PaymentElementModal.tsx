import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentElementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  mode: "add" | "update";
  sessionVersion?: number;
}

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

const PaymentElementForm = ({
  clientSecret,
  mode,
  onSuccess,
  sessionVersion,
  currentSessionVersion,
}: {
  clientSecret: string;
  mode: "add" | "update";
  onSuccess: () => void;
  sessionVersion?: number;
  currentSessionVersion: number;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Confirm SetupIntent with Stripe
      const { setupIntent, error: confirmError } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (confirmError) {
        throw new Error(confirmError.message || "Failed to confirm card");
      }

      if (!setupIntent || setupIntent.status !== "succeeded") {
        throw new Error("SetupIntent confirmation failed");
      }

      // Verify session hasn't expired
      if (sessionVersion !== undefined && currentSessionVersion !== sessionVersion) {
        return;
      }

      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;

      if (!jwt) {
        throw new Error("No session");
      }

      // Call edge function to attach payment method
      const response = await supabase.functions.invoke("update-payment-method", {
        body: {
          setup_intent_id: setupIntent.id,
          payment_method_id: setupIntent.payment_method,
        },
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to save payment method");
      }

      toast("Payment method saved successfully", { icon: "✓" });
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive" data-testid="form-error-message">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {mode === "add" ? "Add payment method" : "Update payment method"}
        </Button>
      </div>
    </form>
  );
};

const PaymentElementModal = ({
  open,
  onOpenChange,
  onSuccess,
  mode,
  sessionVersion = 0,
}: PaymentElementModalProps) => {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const currentSessionVersionRef = useRef(sessionVersion);

  useEffect(() => {
    currentSessionVersionRef.current = sessionVersion;
  }, [sessionVersion]);

  useEffect(() => {
    if (!open) {
      setClientSecret("");
      setError("");
      return;
    }

    const createSetupIntent = async () => {
      setIsLoading(true);
      setError("");

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const jwt = session?.access_token;

        if (!jwt) {
          throw new Error("No session");
        }

        const response = await supabase.functions.invoke("create-setup-intent", {
          headers: { Authorization: `Bearer ${jwt}` },
        });

        if (response.error) {
          throw new Error(response.error.message || "Failed to create payment setup");
        }

        setClientSecret(response.data.client_secret);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create payment setup";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    createSetupIntent();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-secondary" />
            {mode === "add" ? "Add Payment Method" : "Update Payment Method"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === "add"
              ? "Add a new card to your account"
              : "Replace your current payment method"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isLoading && !error && (
            <div className="flex items-center justify-center py-8" data-testid="setup-intent-loading">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive mb-3">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                data-testid="error-close-button"
              >
                Close
              </Button>
            </div>
          )}

          {clientSecret && !error && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentElementForm
                clientSecret={clientSecret}
                mode={mode}
                onSuccess={onSuccess}
                sessionVersion={sessionVersion}
                currentSessionVersion={currentSessionVersionRef.current}
              />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentElementModal;
