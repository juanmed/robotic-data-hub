import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle, LayoutDashboard, KeyRound, Settings } from "lucide-react";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/marketplace", label: "Marketplace" },
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
          {isAuthenticated && (
            <Link
              to="/search"
              className={cn(
                "px-4 py-2 rounded-lg text-sm transition-colors",
                location.pathname === "/search"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              Search
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    ["/dashboard", "/keys", "/settings"].some((p) => location.pathname.startsWith(p))
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => navigate("/dashboard")} className="gap-2 cursor-pointer">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/keys")} className="gap-2 cursor-pointer">
                  <KeyRound className="h-4 w-4" />
                  Keys
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/settings")} className="gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
