import { ArrowRight, Database, Upload, Download } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-dark">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-neon-cyan/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-neon-purple/5 blur-[120px]" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(230_15%_18%/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(230_15%_18%/0.3)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground mb-8 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Now in Public Beta
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-6 leading-[0.95]">
          <span className="text-glow-cyan text-primary">Robotic</span> Data
          <br />
          <span className="text-glow-purple text-secondary">Infrastructure</span>
        </h1>

        <p className="max-w-xl mx-auto text-lg text-muted-foreground mb-12 leading-relaxed font-light">
          Upload, annotate, and distribute multimodal robotics datasets. 
          Built for the next generation of autonomous systems.
        </p>

        <div className="flex items-center justify-center gap-4 mb-20">
          <button className="group flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all">
            Start uploading
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button className="rounded-full border border-border px-6 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors">
            View documentation
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: Upload, title: "Ingest", desc: "Stream video, LiDAR, IMU & more" },
            { icon: Database, title: "Annotate", desc: "Label and enrich your datasets" },
            { icon: Download, title: "Distribute", desc: "Publish and monetize your data" },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/50 bg-card/50 p-6 text-left backdrop-blur-sm hover:border-primary/30 hover:border-glow transition-all duration-300"
            >
              <Icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* Code snippet */}
        <div className="mt-16 max-w-lg mx-auto rounded-xl border border-border/50 bg-card/80 p-5 text-left backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <pre className="font-mono-code text-xs text-muted-foreground leading-relaxed">
            <code>
              <span className="text-primary">curl</span> -X POST /api/v1/sessions \{"\n"}
              {"  "}-H <span className="text-secondary">"Authorization: Bearer $API_KEY"</span> \{"\n"}
              {"  "}-d <span className="text-secondary">'{`{"name": "lidar_run_042"}`}'</span>
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
