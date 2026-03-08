import { ArrowRight, Layers, Upload, Search, Tag, ShoppingBag, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";

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

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
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
