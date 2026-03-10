import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle } from "lucide-react";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/marketplace", label: "Marketplace" },
];

const authLinks = [
  { to: "/search", label: "Search" },
  { to: "/sessions", label: "Sessions" },
  { to: "/dashboard", label: "Dashboard" },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-neon opacity-90" />
          <span className="text-lg font-semibold tracking-tight text-foreground">GamiphyAI</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {publicLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "px-4 py-2 rounded-lg text-sm transition-colors",
                location.pathname === to
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              {label}
            </Link>
          ))}
          {isAuthenticated && authLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "px-4 py-2 rounded-lg text-sm transition-colors",
                location.pathname === to
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              {label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/dashboard/api-keys"
              className={cn(
                "px-4 py-2 rounded-lg text-sm transition-colors",
                location.pathname === "/dashboard/api-keys"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              API Keys
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  location.pathname === "/profile"
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.name}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Button variant="neon" size="sm" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
