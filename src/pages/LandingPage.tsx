import { ArrowRight, Layers, Upload, Search, Tag, ShoppingBag, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import { lovable } from "@/integrations/lovable/index";

const features = [
  { icon: Layers, title: "Session-Centric Robotics Data", desc: "Organize captures into sessions with multiple data streams — video, LiDAR, IMU, and more." },
  { icon: Upload, title: "Multimodal Uploads", desc: "Upload any sensor modality. Our platform handles video, point clouds, time-series, and custom formats." },
  { icon: Search, title: "Searchable Datasets", desc: "Find exactly the data you need with full-text search, tag filters, and metadata queries." },
  { icon: Tag, title: "Annotation Tools", desc: "Label bounding boxes, segmentation masks, keypoints, and custom annotations directly in-browser." },
  { icon: ShoppingBag, title: "Dataset Marketplace", desc: "Publish your datasets for the community or sell premium collections to fund your research." },
  { icon: Globe, title: "Browser-Based Platform", desc: "No SDKs or CLI tools required. Upload, browse, annotate, and download from any modern browser." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative flex items-center justify-center min-h-[90vh] overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-1/3 left-1/4 h-[500px] w-[500px] rounded-full bg-neon-cyan/5 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-neon-purple/5 blur-[120px] pointer-events-none" />

        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(230_15%_18%/0.25)_1px,transparent_1px),linear-gradient(90deg,hsl(230_15%_18%/0.25)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

        <div className="relative z-10 container mx-auto px-6 text-center pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/20 px-4 py-1.5 text-xs text-muted-foreground mb-8 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Now in Public Beta
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6">
            <span className="text-glow-cyan text-primary">Gamiphy</span>
            <span className="text-foreground">AI</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed font-light">
            Capture, organize, search, annotate, publish, and monetize multimodal robotic data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Button variant="neon" size="lg" asChild>
              <Link to="/dashboard">
                Enter Platform
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="neon-outline" size="lg" asChild>
              <Link to="/marketplace">Explore Datasets</Link>
            </Button>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="gap-2 mb-8"
            onClick={async () => {
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (result?.error) {
                console.error("Google sign-in failed:", result.error.message);
              }
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Get Started with Google
          </Button>

          {/* Terminal snippet */}
          <div className="mt-16 max-w-lg mx-auto rounded-xl border border-border/50 bg-card/60 p-5 text-left backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
            </div>
            <pre className="font-mono-code text-xs text-muted-foreground leading-relaxed overflow-x-auto">
              <code>
                <span className="text-primary">curl</span> -X POST /api/v1/sessions \{"\n"}
                {"  "}-H <span className="text-secondary">"Authorization: Bearer $API_KEY"</span> \{"\n"}
                {"  "}-d <span className="text-secondary">'{`{"name": "lidar_run_042"}`}'</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <SectionHeader
            title="Built for Robotics Teams"
            subtitle="Everything you need to capture, manage, and distribute high-quality robotics datasets."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {features.map(({ icon: Icon, title, desc }) => (
              <GlassCard key={title}>
                <Icon className="h-5 w-5 text-primary mb-4" />
                <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 GamiphyAI. All rights reserved.</span>
          <div className="flex gap-6">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Docs</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
