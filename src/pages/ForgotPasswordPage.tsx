import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 h-[400px] w-[400px] rounded-full bg-neon-cyan/5 blur-[140px] pointer-events-none" />
        <div className="relative z-10 w-full max-w-md px-6 text-center">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground mb-6">
            If an account exists for <strong className="text-foreground">{email}</strong>, we've sent a password reset link.
          </p>
          <Link to="/login">
            <Button variant="outline" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 h-[400px] w-[400px] rounded-full bg-neon-cyan/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 h-[300px] w-[300px] rounded-full bg-neon-purple/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-gradient-neon opacity-90" />
            <span className="text-lg font-semibold text-foreground">GamiphyAI</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>
          </div>

          <Button variant="neon" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Back to Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
