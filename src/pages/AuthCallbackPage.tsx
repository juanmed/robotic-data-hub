import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle hash-based tokens (implicit flow)
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);

        // PKCE flow: exchange code for session
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setError(error.message);
            return;
          }
        }

        // Check for error in URL
        const urlError = params.get("error_description") || params.get("error");
        if (urlError) {
          setError(urlError);
          return;
        }

        // Determine where to redirect based on the auth event type
        const hashParams = new URLSearchParams(hash.replace("#", ""));
        const type = hashParams.get("type") || params.get("type");

        if (type === "recovery") {
          navigate("/reset-password", { replace: true });
        } else {
          // For email verification, signup confirmation, etc.
          navigate("/login", { replace: true });
        }
      } catch (err: any) {
        setError(err.message || "Authentication failed");
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h1>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <a href="/login" className="text-primary hover:underline text-sm">Go to Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Verifying your account...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
