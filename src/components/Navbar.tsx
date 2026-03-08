import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-neon opacity-90" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            GamiphyAI
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Platform</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Datasets</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Docs</Link>
          <Link to="/" className="hover:text-foreground transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </button>
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
