import { useState, useCallback } from "react";
import { annotationService, type SessionAnnotation, type AnnotationType, type AnnotationTarget } from "@/services/annotationService";
import type { Stream } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Plus,
  X,
  Trash2,
  MessageSquareText,
  Subtitles,
  Tag,
  MicVocal,
  Clock,
  Radio,
  Layers,
} from "lucide-react";

const typeConfig: Record<AnnotationType, { icon: typeof Tag; label: string; color: string }> = {
  text_note:  { icon: MessageSquareText, label: "Text Note",  color: "hsl(170 100% 50%)" },
  subtitle:   { icon: Subtitles,         label: "Subtitle",   color: "hsl(260 100% 65%)" },
  tag:        { icon: Tag,               label: "Tag",        color: "hsl(45 100% 55%)" },
  voice_note: { icon: MicVocal,          label: "Voice Note", color: "hsl(330 70% 60%)" },
};

const targetConfig: Record<AnnotationTarget, { icon: typeof Layers; label: string }> = {
  session:    { icon: Layers, label: "Session" },
  stream:     { icon: Radio,  label: "Stream" },
  time_range: { icon: Clock,  label: "Time Range" },
};

interface AnnotationPanelProps {
  sessionId: string;
  streams: Stream[];
  annotations: SessionAnnotation[];
  onAnnotationCreated: (ann: SessionAnnotation) => void;
  onAnnotationDeleted: (id: string) => void;
  variant?: "sidebar" | "full";
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return m > 0 ? `${m}:${sec.padStart(4, "0")}` : `${sec}s`;
};

const AnnotationPanel = ({ sessionId, streams, annotations, onAnnotationCreated, onAnnotationDeleted, variant = "sidebar" }: AnnotationPanelProps) => {
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [type, setType] = useState<AnnotationType>("text_note");
  const [target, setTarget] = useState<AnnotationTarget>("session");
  const [streamId, setStreamId] = useState("");
  const [content, setContent] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [error, setError] = useState("");

  const handleCreate = useCallback(async () => {
    setError("");
    if (!content.trim()) {
      setError("Content is required.");
      return;
    }
    if (target === "time_range" && (!timeStart || !timeEnd)) {
      setError("Time range is required.");
      return;
    }

    const ann = await annotationService.create({
      session_id: sessionId,
      stream_id: target === "stream" || target === "time_range" ? streamId || undefined : undefined,
      target,
      type,
      content: content.trim(),
      time_start: target === "time_range" ? parseFloat(timeStart) : undefined,
      time_end: target === "time_range" ? parseFloat(timeEnd) : undefined,
      author: "Alex Chen",
    });

    onAnnotationCreated(ann);
    setContent("");
    setTimeStart("");
    setTimeEnd("");
    setShowForm(false);
  }, [sessionId, type, target, streamId, content, timeStart, timeEnd, onAnnotationCreated]);

  const handleDelete = useCallback(async (id: string) => {
    await annotationService.remove(id);
    onAnnotationDeleted(id);
  }, [onAnnotationDeleted]);

  const resetForm = () => {
    setShowForm(false);
    setContent("");
    setTimeStart("");
    setTimeEnd("");
    setError("");
  };

  const isSidebar = variant === "sidebar";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-foreground flex items-center gap-1.5 ${isSidebar ? "text-xs" : "text-sm"}`}>
          <Tag className={`text-secondary ${isSidebar ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
          Annotations
          {annotations.length > 0 && (
            <span className="text-[10px] text-muted-foreground font-normal">({annotations.length})</span>
          )}
        </h3>
        {!showForm && (
          <Button
            variant="ghost"
            size="icon"
            className={`${isSidebar ? "h-6 w-6" : "h-7 w-7"}`}
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-background/40 p-3 space-y-3 animate-fade-in shadow-[0_0_15px_hsl(var(--primary)/0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">New Annotation</span>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-[10px] text-destructive">
              {error}
            </div>
          )}

          {/* Type selector */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(typeConfig) as [AnnotationType, typeof typeConfig.text_note][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      type === key
                        ? "border border-primary/30 bg-primary/10 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.1)]"
                        : "border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50"
                    }`}
                  >
                    <Icon className="h-3 w-3" style={{ color: type === key ? cfg.color : undefined }} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target selector */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Target</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.entries(targetConfig) as [AnnotationTarget, typeof targetConfig.session][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setTarget(key)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      target === key
                        ? "border border-secondary/30 bg-secondary/10 text-secondary"
                        : "border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stream picker */}
          {(target === "stream" || target === "time_range") && streams.length > 0 && (
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Stream (optional)</label>
              <select
                value={streamId}
                onChange={(e) => setStreamId(e.target.value)}
                className="w-full rounded-lg border border-border/40 bg-background/50 py-1.5 px-3 text-[11px] text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="">All streams</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Time range */}
          {target === "time_range" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Start (s)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  placeholder="0.0"
                  className="w-full rounded-lg border border-border/40 bg-background/50 py-1.5 px-3 text-[11px] font-mono-code text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">End (s)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  placeholder="5.0"
                  className="w-full rounded-lg border border-border/40 bg-background/50 py-1.5 px-3 text-[11px] font-mono-code text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">
              {type === "tag" ? "Tag" : "Description"}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={type === "tag" ? "e.g. high-quality" : "Describe the annotation..."}
              maxLength={500}
              rows={type === "tag" ? 1 : 2}
              className="w-full rounded-lg border border-border/40 bg-background/50 py-1.5 px-3 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>

          <Button variant="neon" size="sm" className="w-full text-[11px]" onClick={handleCreate}>
            Add Annotation
          </Button>
        </div>
      )}

      {/* Annotations list */}
      {annotations.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-border/30 bg-background/10 px-4 py-6 text-center">
          <Tag className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-[10px] text-muted-foreground">No annotations yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-[10px] text-primary hover:underline mt-1"
          >
            Add first annotation
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {annotations.map((ann) => {
            const cfg = typeConfig[ann.type];
            const Icon = cfg.icon;
            return (
              <div
                key={ann.id}
                className="group relative rounded-xl border border-border/30 bg-background/20 px-3 py-2.5 hover:border-border/50 transition-all animate-fade-in"
              >
                {/* Glow accent */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
                  style={{ backgroundColor: ann.color, boxShadow: `0 0 6px ${ann.color}` }}
                />

                <div className="flex items-start gap-2 pl-1.5">
                  <div
                    className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${ann.color}15` }}
                  >
                    <Icon className="h-2.5 w-2.5" style={{ color: ann.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground leading-relaxed">{ann.content}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${ann.color}15`, color: ann.color }}
                      >
                        {cfg.label}
                      </span>
                      {ann.target === "time_range" && ann.time_start !== undefined && ann.time_end !== undefined && (
                        <span className="text-[9px] font-mono-code text-muted-foreground">
                          {formatTime(ann.time_start)} → {formatTime(ann.time_end)}
                        </span>
                      )}
                      {ann.target === "session" && (
                        <span className="text-[9px] text-muted-foreground">Session-level</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnnotationPanel;
