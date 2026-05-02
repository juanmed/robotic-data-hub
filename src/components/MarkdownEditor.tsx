import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => Promise<void> | void;
  readOnly?: boolean;
  placeholder?: string;
  minRows?: number;
  className?: string;
  showSaveButton?: boolean;
}

export const MarkdownEditor = ({
  value,
  onChange,
  onBlur,
  readOnly = false,
  placeholder = '',
  minRows = 50,
  className = '',
  showSaveButton = false,
}: MarkdownEditorProps) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  if (readOnly) {
    const isEmpty = !localValue || !localValue.trim();
    return (
      <div className={className}>
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">No content provided.</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none dark">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{localValue}</ReactMarkdown>
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
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange?.(e.target.value);
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={minRows}
          className="font-mono text-sm resize-y"
        />
      )}

      {/* Preview pane */}
      {mode === 'preview' && (
        <div className="prose prose-invert prose-sm max-w-none dark rounded-lg border border-border/30 bg-card/30 p-4 min-h-[200px]">
          {!localValue || !localValue.trim() ? (
            <p className="text-sm text-muted-foreground">No content to preview.</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{localValue}</ReactMarkdown>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
