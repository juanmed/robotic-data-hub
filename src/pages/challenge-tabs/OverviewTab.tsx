import { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { challengeService } from '@/services/challengeService';
import { challengeMediaService } from '@/services/challengeMediaService';
import ChallengeMediaUpload from '@/components/ChallengeMediaUpload';
import type { Challenge, ChallengeMedia } from '@/types';
import { toast } from 'sonner';
import { Film, Image as ImageIcon } from 'lucide-react';

interface OutletContextType {
  challenge: Challenge;
  isOwner: boolean;
  onFieldSaved: (updated: Partial<Challenge>) => void;
}

export const OverviewTab = () => {
  const { challenge, isOwner, onFieldSaved } = useOutletContext<OutletContextType>();
  const [localDescription, setLocalDescription] = useState(challenge?.description ?? '');
  const [media, setMedia] = useState<ChallengeMedia[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(new Map());
  const [activeMedia, setActiveMedia] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(true);

  // Load media
  useEffect(() => {
    challengeMediaService
      .list(challenge.id)
      .then((items) => {
        setMedia(items);
        if (items.length > 0) setActiveMedia(items[0].id);
        items.forEach((item) => {
          challengeMediaService
            .getSignedUrl(item.storage_path)
            .then((url) => {
              setMediaUrls((prev) => new Map(prev).set(item.id, url));
            })
            .catch(console.error);
        });
      })
      .catch(console.error)
      .finally(() => setMediaLoading(false));
  }, [challenge.id]);

  const saveDescription = async () => {
    if (localDescription === challenge.description) return;
    try {
      await challengeService.update(challenge.id, { description: localDescription });
      onFieldSaved({ description: localDescription });
      toast.success('Description saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save description');
      setLocalDescription(challenge.description);
    }
  };

  const activeMediaItem = media.find((m) => m.id === activeMedia);
  const activeMediaUrl = activeMedia ? mediaUrls.get(activeMedia) : null;

  return (
    <div className="space-y-6">
      {/* Media gallery */}
      {media.length > 0 && (
        <div className="space-y-3">
          {/* Featured media slot */}
          <div className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
            <div className="aspect-video flex items-center justify-center bg-muted/20">
              {activeMediaUrl && activeMediaItem ? (
                activeMediaItem.content_type.startsWith('video/') ? (
                  <video
                    key={activeMediaUrl}
                    src={activeMediaUrl}
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={activeMediaUrl}
                    alt={activeMediaItem.file_name}
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <Film className="h-12 w-12 text-muted-foreground/20" />
              )}
            </div>
          </div>

          {/* Thumbnail strip */}
          {media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {media.map((m) => {
                const url = mediaUrls.get(m.id);
                const isActive = activeMedia === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveMedia(m.id)}
                    className={`shrink-0 w-20 h-14 rounded-lg border overflow-hidden transition-all ${
                      isActive
                        ? 'border-secondary ring-1 ring-secondary/50'
                        : 'border-border/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {url ? (
                      m.content_type.startsWith('video/') ? (
                        <video
                          src={url}
                          muted
                          preload="metadata"
                          className="w-full h-full object-cover"
                          onLoadedData={(e) => {
                            e.currentTarget.currentTime = 0.1;
                          }}
                        />
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                        <Film className="h-3 w-3 text-muted-foreground/30" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Description editor */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Description</h3>
        {isOwner ? (
          <MarkdownEditor
            value={localDescription}
            onChange={setLocalDescription}
            onBlur={saveDescription}
            placeholder="Describe your challenge, dataset requirements, and expectations..."
            showSaveButton={true}
            challengeId={challenge.id}
            userId={challenge.user_id}
          />
        ) : (
          <MarkdownEditor readOnly value={localDescription} />
        )}
      </div>

      {/* Tags */}
      {challenge.tags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {challenge.tags.map((tag) => (
              <Link
                key={tag}
                to={`/marketplace?tab=challenges&tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1 rounded-full text-[10px] font-medium bg-muted/40 text-muted-foreground border border-border/30 hover:border-secondary/50 hover:text-foreground transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Media upload (owner only) */}
      {isOwner && (
        <div className="space-y-2 border-t border-border/30 pt-6">
          <h4 className="text-sm font-semibold text-foreground">Manage Media</h4>
          <ChallengeMediaUpload
            challengeId={challenge.id}
            userId={challenge.user_id}
            onMediaChange={(updatedMedia) => {
              setMedia(updatedMedia);
              if (updatedMedia.length > 0 && !activeMedia) {
                setActiveMedia(updatedMedia[0].id);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
