import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Stream } from "@/types";

const streamTypes: { value: Stream["type"]; label: string }[] = [
  { value: "video", label: "Video (RGB)" },
  { value: "depth", label: "Depth Camera" },
  { value: "audio", label: "Audio" },
  { value: "imu", label: "IMU" },
  { value: "lidar", label: "LiDAR" },
  { value: "pose", label: "Pose Tracking" },
  { value: "other", label: "Other" },
];

interface AddStreamModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; type: Stream["type"]; device_name: string; sample_rate: string }) => void;
}

const AddStreamModal = ({ open, onClose, onAdd }: AddStreamModalProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<Stream["type"]>("video");
  const [deviceName, setDeviceName] = useState("");
  const [sampleRate, setSampleRate] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Stream name is required.");
      return;
    }
    onAdd({ name: name.trim(), type, device_name: deviceName.trim(), sample_rate: sampleRate.trim() });
    setName("");
    setType("video");
    setDeviceName("");
    setSampleRate("");
    setError("");
  };

  const handleClose = () => {
    setName("");
    setType("video");
    setDeviceName("");
    setSampleRate("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl shadow-[0_0_40px_hsl(var(--primary)/0.1)] animate-scale-in">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add Stream</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Add a sensor stream to this session</p>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Stream Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Front RGB Camera"
              maxLength={100}
              autoFocus
              className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Stream Type</label>
            <div className="grid grid-cols-4 gap-2">
              {streamTypes.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setType(st.value)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    type === st.value
                      ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                      : "border-border/50 bg-background/30 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Device Name</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Intel RealSense D435"
                maxLength={100}
                className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Sample Rate</label>
              <input
                type="text"
                value={sampleRate}
                onChange={(e) => setSampleRate(e.target.value)}
                placeholder="e.g. 30 fps"
                maxLength={50}
                className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="neon">
              Add Stream
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStreamModal;
