import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { challengeSubmissionService } from '@/services/challengeSubmissionService';
import { getDatasetFileUrls, type SignedFileUrl } from '@/services/datasetService';
import { openVisualizer } from '@/lib/visualizer';
import { formatPrice } from '@/lib/marketplace';
import { useAuth } from '@/hooks/useAuth';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Challenge, ChallengeSubmissionEnriched } from '@/types';
import { toast } from 'sonner';
import { Eye, Download, CheckCircle2, XIcon } from 'lucide-react';

interface OutletContextType {
  challenge: Challenge;
  isOwner: boolean;
  onFieldSaved: (updated: Partial<Challenge>) => void;
}

export const SubmissionsTab = () => {
  const { challenge, isOwner } = useOutletContext<OutletContextType>();
  const { isAuthenticated } = useAuth();
  const [submissions, setSubmissions] = useState<ChallengeSubmissionEnriched[]>([]);
  const [filesOpen, setFilesOpen] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedSubmissionName, setSelectedSubmissionName] = useState<string>('');
  const [submissionFiles, setSubmissionFiles] = useState<SignedFileUrl[]>([]);
  const [loading, setLoading] = useState(true);

  const isLumpSum = challenge.compensation_per === 'challenge';

  // Load submissions - full list for owners, accepted-only for non-owners
  useEffect(() => {
    setLoading(true);
    const loadSubmissions = async () => {
      try {
        // Try to fetch submissions
        let allSubmissions: ChallengeSubmissionEnriched[] = [];

        try {
          allSubmissions = await challengeSubmissionService.listForChallengeEnriched(
            challenge.id
          );
        } catch (enrichError) {
          // If enriched fetch fails (likely due to auth/RLS), try plain fetch for public access
          // This allows unauthenticated users to see accepted submissions
          try {
            const plainSubmissions = await challengeSubmissionService.listForChallenge(
              challenge.id
            );
            // Convert plain submissions to enriched format with null enrichment fields
            allSubmissions = plainSubmissions.map((sub) => ({
              ...sub,
              dataset_display_name: null,
              submitter_name: null,
            })) as ChallengeSubmissionEnriched[];
          } catch (plainError: any) {
            // If both fail, check if it's an RLS/auth issue
            console.warn('Failed to fetch submissions:', {
              enrichError: (enrichError as any)?.message,
              plainError: plainError?.message,
              isAuthenticated,
            });
            allSubmissions = [];
          }
        }

        if (isOwner) {
          // Owners see all submissions
          setSubmissions(allSubmissions);
        } else {
          // Non-owners see only accepted submissions
          const acceptedOnly = allSubmissions.filter((s) => s.status === 'accepted');
          setSubmissions(acceptedOnly);
        }
      } catch (err) {
        // This is a fallback for unexpected errors
        console.error('Unexpected error loading submissions:', err);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, [challenge.id, isOwner]);

  const handleVisualizeSubmission = async (datasetId: string) => {
    try {
      await openVisualizer(datasetId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to open visualizer');
    }
  };

  const handleOpenAcceptedFiles = async (datasetId: string, datasetName: string | null) => {
    setFilesOpen(true);
    setFilesLoading(true);
    setSelectedSubmissionName(datasetName || datasetId);
    setSubmissionFiles([]);
    try {
      const urls = await getDatasetFileUrls(datasetId);
      setSubmissionFiles(urls.filter((u) => !!u.signed_url));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load downloadable files');
    } finally {
      setFilesLoading(false);
    }
  };

  const handleSubmissionAction = async (subId: string, status: 'accepted' | 'rejected') => {
    try {
      await challengeSubmissionService.updateStatus(subId, status);
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === subId ? { ...sub, status } : sub))
      );
      toast.success(`Submission ${status}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  // Show empty state
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading submissions...</p>;
  }

  if (submissions.length === 0) {
    return <p className="text-sm text-muted-foreground">No submissions yet.</p>;
  }

  // Non-owner view (only accepted submissions visible)
  if (!isOwner) {
    return (
      <div className="space-y-3">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className="rounded-xl border border-border/30 bg-background/30 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {sub.dataset_display_name || sub.dataset_id}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Dataset ID: <span className="font-mono">{sub.dataset_id}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Submitter: {sub.submitter_name || sub.submitter_id}
              </p>
              {sub.message && (
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                  {sub.message}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(sub.created_at).toLocaleDateString()} &middot;{' '}
                <span className="text-green-400">accepted</span>
              </p>
              <p className="text-[10px] text-green-400 mt-1">
                Payout: {formatPrice(challenge.compensation_amount, challenge.currency)}{' '}
                {isLumpSum ? '(lump sum)' : 'per dataset'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-[10px]"
                  onClick={() => handleVisualizeSubmission(sub.dataset_id)}
                >
                  <Eye className="h-3 w-3" /> Visualize
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Owner view (all submissions with accept/reject buttons)
  return (
    <div className="space-y-3">
      {submissions.map((sub) => (
        <div key={sub.id} className="rounded-xl border border-border/30 bg-background/30 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              {sub.dataset_display_name || sub.dataset_id}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Dataset ID: <span className="font-mono">{sub.dataset_id}</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Submitter: {sub.submitter_name || sub.submitter_id}
            </p>
            {sub.message && (
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{sub.message}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(sub.created_at).toLocaleDateString()} &middot;{' '}
              <span
                className={
                  sub.status === 'accepted'
                    ? 'text-green-400'
                    : sub.status === 'rejected'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }
              >
                {sub.status}
              </span>
            </p>
            {sub.status === 'accepted' && (
              <p className="text-[10px] text-green-400 mt-1">
                Accepted payout: {formatPrice(challenge.compensation_amount, challenge.currency)}{' '}
                {isLumpSum ? '(lump sum)' : 'per dataset'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-[10px]"
              onClick={() => handleVisualizeSubmission(sub.dataset_id)}
            >
              <Eye className="h-3 w-3" /> Visualize
            </Button>
            {sub.status === 'accepted' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[10px]"
                onClick={() => handleOpenAcceptedFiles(sub.dataset_id, sub.dataset_display_name)}
              >
                <Download className="h-3 w-3" /> Access Files
              </Button>
            )}
            {sub.status === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-[10px] text-green-400 hover:text-green-400"
                  onClick={() => handleSubmissionAction(sub.id, 'accepted')}
                >
                  <CheckCircle2 className="h-3 w-3" /> Accept
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-[10px] text-red-400 hover:text-red-400"
                  onClick={() => handleSubmissionAction(sub.id, 'rejected')}
                >
                  <XIcon className="h-3 w-3" /> Reject
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      {/* File access dialog */}
      <Dialog open={filesOpen} onOpenChange={setFilesOpen}>
        <DialogContent className="sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Accepted Submission Files</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedSubmissionName}
            </DialogDescription>
          </DialogHeader>
          {filesLoading ? (
            <div className="h-24 rounded-xl bg-muted/20 animate-pulse" />
          ) : submissionFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No downloadable files available.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {submissionFiles.map((file) => (
                <div
                  key={file.relative_path}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-background/30 p-2.5"
                >
                  <span className="text-[11px] font-mono text-foreground truncate">
                    {file.relative_path}
                  </span>
                  <a href={file.signed_url ?? '#'} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]">
                      Download
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionsTab;
