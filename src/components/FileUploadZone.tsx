import { useState, useCallback, useRef } from "react";
import { Upload, X, CheckCircle2 } from "lucide-react";
import type { AssetFile } from "@/types";

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "complete" | "error";
}

interface FileUploadZoneProps {
  streamId: string;
  onFileUploaded: (file: AssetFile) => void;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const FileUploadZone = ({ streamId, onFileUploaded }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = useCallback(
    (file: File) => {
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const entry: UploadingFile = { id: uploadId, file, progress: 0, status: "uploading" };
      setUploads((prev) => [...prev, entry]);

      // Simulate progress in steps
      const totalDuration = 1200 + Math.random() * 1800; // 1.2s – 3s
      const steps = 20;
      const interval = totalDuration / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        const progress = Math.min(Math.round((step / steps) * 100), 100);

        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress } : u))
        );

        if (step >= steps) {
          clearInterval(timer);

          // Mark complete
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, status: "complete", progress: 100 } : u
            )
          );

          // Create mock AssetFile
          const ext = file.name.split(".").pop() || "bin";
          const contentTypeMap: Record<string, string> = {
            mp4: "video/mp4",
            avi: "video/x-msvideo",
            mov: "video/quicktime",
            wav: "audio/wav",
            mp3: "audio/mpeg",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            csv: "text/csv",
            json: "application/json",
            pcd: "application/octet-stream",
            bag: "application/octet-stream",
          };

          const assetFile: AssetFile = {
            id: `af_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            stream_id: streamId,
            filename: file.name,
            size_bytes: file.size,
            content_type: contentTypeMap[ext] || "application/octet-stream",
            s3_key: `${streamId}/${file.name}`,
            uploaded_at: new Date().toISOString(),
          };

          onFileUploaded(assetFile);

          // Remove from uploads list after a short delay
          setTimeout(() => {
            setUploads((prev) => prev.filter((u) => u.id !== uploadId));
          }, 1500);
        }
      }, interval);
    },
    [streamId, onFileUploaded]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => simulateUpload(file));
    },
    [simulateUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="mt-4 space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/5 shadow-[inset_0_0_30px_hsl(var(--primary)/0.08),0_0_20px_hsl(var(--primary)/0.1)]"
            : "border-border/40 bg-background/20 hover:border-primary/30 hover:bg-primary/[0.02]"
        }`}
      >
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
              isDragging
                ? "bg-primary/15 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                : "bg-muted/30"
            }`}
          >
            <Upload
              className={`h-5 w-5 transition-colors ${
                isDragging ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
          <p className="text-xs text-foreground font-medium mb-1">
            {isDragging ? "Drop files here" : "Drag & drop files"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            or click to browse — video, audio, images, sensor data
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Active uploads */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="rounded-xl border border-border/30 bg-card/40 px-4 py-3 animate-fade-in"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {upload.status === "complete" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-primary/40 border-t-primary animate-spin shrink-0" />
                  )}
                  <span className="text-xs font-mono-code text-foreground truncate">
                    {upload.file.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(upload.file.size)}
                  </span>
                  <span className="text-[10px] font-medium text-primary">
                    {upload.progress}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 w-full rounded-full bg-border/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200 ease-out"
                  style={{
                    width: `${upload.progress}%`,
                    background:
                      upload.status === "complete"
                        ? "hsl(var(--primary))"
                        : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))",
                    boxShadow:
                      upload.status === "uploading"
                        ? "0 0 8px hsl(var(--primary) / 0.5)"
                        : "none",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
