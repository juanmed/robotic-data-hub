import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, Film, Image as ImageIcon, GripVertical } from "lucide-react";
import { challengeMediaService } from "@/services/challengeMediaService";
import type { ChallengeMedia } from "@/types";

interface ChallengeMediaUploadProps {
  challengeId: string;
  userId: string;
  onMediaChange?: (media: ChallengeMedia[]) => void;
}

const MAX_FILES = 10;
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

const ChallengeMediaUpload = ({ challengeId, userId, onMediaChange }: ChallengeMediaUploadProps) => {
  const [media, setMedia] = useState<ChallengeMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    challengeMediaService.list(challengeId).then((items) => {
      setMedia(items);
      onMediaChange?.(items);
      items.forEach((item) => {
        challengeMediaService.getSignedUrl(item.storage_path).then((url) => {
          setSignedUrls((prev) => new Map(prev).set(item.id, url));
        });
      });
    }).catch(console.error);
  }, [challengeId]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || uploading) return;
    const toUpload = Array.from(files).filter((f) => {
      if (f.size > MAX_SIZE_BYTES) return false;
      if (!f.type.startsWith("video/") && !f.type.startsWith("image/")) return false;
      return true;
    });
    if (media.length + toUpload.length > MAX_FILES) return;

    setUploading(true);
    try {
      const newMedia: ChallengeMedia[] = [];
      for (const file of toUpload) {
        const m = await challengeMediaService.upload(challengeId, userId, file);
        newMedia.push(m);
        const url = await challengeMediaService.getSignedUrl(m.storage_path);
        setSignedUrls((prev) => new Map(prev).set(m.id, url));
      }
      const updated = [...media, ...newMedia];
      setMedia(updated);
      onMediaChange?.(updated);
    } finally {
      setUploading(false);
    }
  }, [challengeId, userId, media, uploading, onMediaChange]);

  const handleDelete = async (item: ChallengeMedia) => {
    await challengeMediaService.delete(item.id, item.storage_path);
    const updated = media.filter((m) => m.id !== item.id);
    setMedia(updated);
    onMediaChange?.(updated);
  };

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
          isDragging
            ? "border-secondary bg-secondary/5"
            : "border-border/40 bg-background/20 hover:border-secondary/30"
        } ${media.length >= MAX_FILES ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <Upload className={`h-5 w-5 mb-2 ${isDragging ? "text-secondary" : "text-muted-foreground"}`} />
          <p className="text-xs text-foreground font-medium mb-1">
            {uploading ? "Uploading..." : isDragging ? "Drop files here" : "Drag & drop videos or images"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Max {MAX_FILES} files, 100MB each
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Media preview grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {media.map((item) => {
            const url = signedUrls.get(item.id);
            const isVideo = item.content_type.startsWith("video/");
            return (
              <div
                key={item.id}
                className="relative rounded-xl border border-border/30 bg-card/40 overflow-hidden group"
              >
                <div className="aspect-video flex items-center justify-center bg-muted/20">
                  {url ? (
                    isVideo ? (
                      <video src={url} muted preload="metadata" className="w-full h-full object-cover"
                        onLoadedData={(e) => { e.currentTarget.currentTime = 0.1; }} />
                    ) : (
                      <img src={url} alt={item.file_name} className="w-full h-full object-cover" />
                    )
                  ) : (
                    isVideo ? <Film className="h-6 w-6 text-muted-foreground/30" /> : <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                    className="h-6 w-6 rounded-full bg-card/80 backdrop-blur-sm border border-border/40 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                  >
                    <X className="h-3 w-3 text-foreground" />
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground truncate px-2 py-1">
                  {item.file_name}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChallengeMediaUpload;
