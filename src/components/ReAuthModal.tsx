import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ReAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type AuthProvider = "password" | "google" | "apple" | "unknown";

const ReAuthModal = ({ open, onOpenChange, onSuccess }: ReAuthModalProps) => {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<AuthProvider>("password");

  // Detect auth provider on mount
  useEffect(() => {
    const detectProvider = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user?.user_metadata?.provider) {
          setProvider(data.session.user.user_metadata.provider as AuthProvider);
        } else {
          setProvider("password");
        }
      } catch {
        setProvider("password");
      }
    };

    if (open) {
      detectProvider();
      setPassword("");
      setError("");
    }
  }, [open]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password,
      });

      if (error) {
        setError(error.message || "Invalid password");
        setIsLoading(false);
        return;
      }

      // Success
      onSuccess();
      onOpenChange(false);
      toast.success("Re-authenticated successfully");
    } catch (err) {
      setError("An error occurred during re-authentication");
      setIsLoading(false);
    }
  };

  const handleOAuthRedirect = async () => {
    try {
      setIsLoading(true);
      await lovable.auth.signInWithOAuth(provider as "google" | "apple");
      // Note: After OAuth redirect and callback, onSuccess will be called by the auth flow
    } catch (err) {
      setError("Failed to redirect to authentication provider");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Re-authenticate</DialogTitle>
          <DialogDescription>
            Please verify your identity to view payment information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email field (read-only) */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>

          {/* Password or OAuth based on provider */}
          {provider === "password" ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  disabled={isLoading}
                />
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="w-full"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You signed in with {provider === "google" ? "Google" : provider}. Please re-authenticate with the same provider.
              </p>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button
                onClick={handleOAuthRedirect}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLoading
                  ? "Redirecting..."
                  : `Re-authenticate with ${provider === "google" ? "Google" : provider}`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReAuthModal;
