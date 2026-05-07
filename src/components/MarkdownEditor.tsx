import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { challengeMediaService } from '@/services/challengeMediaService';
import { blogMediaService } from '@/services/blogMediaService';
import { toast } from 'sonner';

interface UploaderResult {
  url: string;
  alt?: string;
}

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => Promise<void> | void;
  readOnly?: boolean;
  placeholder?: string;
  minRows?: number;
  className?: string;
  showSaveButton?: boolean;
  challengeId?: string;
  userId?: string;
  uploader?: (file: File) => Promise<UploaderResult>;
}

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    video: ['src', 'controls', 'width', 'height'],
    img: [...(defaultSchema.attributes?.img ?? []), 'src', 'alt'],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), 'video'],
};

// Component to render preview with transformed blog-media links
const PreviewRenderer = ({ content }: { content: string }) => {
  const [transformed, setTransformed] = useState(content);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const transformBlogMediaLinks = async (markdown: string) => {
      try {
        const regex = /blog-media:storage_path:([^\s)]+)/g;
        let result = markdown;
        const matches = Array.from(markdown.matchAll(regex));

        for (const match of matches) {
          const storagePath = match[1];
          try {
            const signedUrl = await blogMediaService.getSignedUrl(storagePath);
            result = result.replace(
              `blog-media:storage_path:${storagePath}`,
              signedUrl
            );
          } catch (err) {
            console.error(`Failed to get signed URL for ${storagePath}:`, err);
          }
        }

        setTransformed(result);
      } catch (err) {
        console.error("Error transforming markdown:", err);
        setTransformed(markdown);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    transformBlogMediaLinks(content);
  }, [content]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading preview...</p>;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
    >
      {transformed}
    </ReactMarkdown>
  );
};

export const MarkdownEditor = ({
  value,
  onChange,
  onBlur,
  readOnly = false,
  placeholder = '',
  minRows = 50,
  className = '',
  showSaveButton = false,
  challengeId,
  userId,
  uploader,
}: MarkdownEditorProps) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const executeSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      await Promise.resolve(onBlur?.());
      setSaveStatus('saved');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSave();
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const insertAtCursor = (currentValue: string, text: string, replaces?: string) => {
    const ta = textareaRef.current;
    if (!ta) return currentValue;

    const start = ta.selectionStart ?? currentValue.length;
    const end = ta.selectionEnd ?? currentValue.length;
    const beforeIdx = replaces ? currentValue.indexOf(replaces) : start;
    const afterIdx = replaces && beforeIdx >= 0 ? beforeIdx + replaces.length : end;

    const before = currentValue.slice(0, beforeIdx >= 0 ? beforeIdx : start);
    const after = currentValue.slice(afterIdx);
    const newValue = before + text + after;

    return newValue;
  };

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    // Check if we have either uploader callback OR challenge context
    const hasUploader = !!uploader;
    const hasChallengeContext = challengeId && userId;
    if (!hasUploader && !hasChallengeContext) return;
    if (readOnly) return;

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Only images and videos can be dropped into the editor');
      return;
    }

    // Validate size (100 MB cap)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File exceeds 100 MB limit');
      return;
    }

    const placeholderId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const placeholder = `[Uploading ${file.name} (${placeholderId})...]`;

    // Insert placeholder at cursor immediately
    let currentValue = insertAtCursor(localValue, placeholder);
    setLocalValue(currentValue);
    onChange?.(currentValue);
    setUploadingCount((c) => c + 1);

    try {
      let markdown: string;

      if (uploader) {
        // Use custom uploader callback
        const result = await uploader(file);
        markdown = file.type.startsWith('video/')
          ? `<video src="${result.url}" controls width="100%"></video>`
          : `![${result.alt || file.name}](${result.url})`;
      } else if (hasChallengeContext && challengeId && userId) {
        // Fall back to challenge media service
        const media = await challengeMediaService.upload(challengeId, userId, file);
        const url = await challengeMediaService.getEmbedUrl(media.storage_path);

        markdown = file.type.startsWith('video/')
          ? `<video src="${url}" controls width="100%"></video>`
          : `![${file.name}](${url})`;
      } else {
        throw new Error('No upload handler configured');
      }

      // Replace placeholder with actual markdown
      currentValue = insertAtCursor(currentValue, markdown, placeholder);
      setLocalValue(currentValue);
      onChange?.(currentValue);

      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          const placeholderIdx = currentValue.indexOf(placeholder);
          const markdownIdx = currentValue.indexOf(markdown);
          const pos = markdownIdx >= 0 ? markdownIdx + markdown.length : currentValue.length;
          ta.setSelectionRange(pos, pos);
          ta.focus();
        }
      });
    } catch (err: any) {
      // Remove placeholder on error
      currentValue = insertAtCursor(currentValue, '', placeholder);
      setLocalValue(currentValue);
      onChange?.(currentValue);
      toast.error(err.message || 'Failed to upload media');
    } finally {
      setUploadingCount((c) => c - 1);
    }
  };

  if (readOnly) {
    const isEmpty = !localValue || !localValue.trim();
    return (
      <div className={className}>
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">No content provided.</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none dark">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
            >
              {localValue}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex gap-2 mb-2 border-b border-border/30 pb-2 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={mode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('edit')}
            className="text-xs"
          >
            Edit
          </Button>
          <Button
            variant={mode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('preview')}
            className="text-xs"
          >
            Preview
          </Button>
        </div>
        {showSaveButton && mode === 'edit' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={executeSave}
            disabled={isSaving}
            className="text-xs gap-1.5"
          >
            {isSaving || saveStatus === 'saving' ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="h-3 w-3 text-green-500" /> Saved
              </>
            ) : (
              'Save'
            )}
          </Button>
        )}
      </div>

      {/* Edit pane */}
      {mode === 'edit' && (
        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange?.(e.target.value);
          }}
          onBlur={handleBlur}
          onDragOver={(e) => {
            e.preventDefault();
            if ((uploader || (challengeId && userId)) && !readOnly) setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          placeholder={placeholder}
          rows={minRows}
          disabled={uploadingCount > 0}
          className={`font-mono text-sm resize-y ${
            isDraggingOver ? 'ring-2 ring-secondary/60 border-secondary' : ''
          }`}
        />
      )}

      {/* Preview pane */}
      {mode === 'preview' && (
        <div className="prose prose-invert prose-sm max-w-none dark rounded-lg border border-border/30 bg-card/30 p-4 min-h-[200px]">
          {!localValue || !localValue.trim() ? (
            <p className="text-sm text-muted-foreground">No content to preview.</p>
          ) : (
            <PreviewRenderer content={localValue} />
          )}
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
