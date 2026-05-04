import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isPast } from 'date-fns';
import type { Challenge } from '@/types';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Target,
  Calendar,
  MessageSquare,
  Share2,
  Check,
  Pencil,
  ToggleLeft,
  ToggleRight,
  XCircle,
} from 'lucide-react';

interface ChallengeMetaSidebarProps {
  challenge: Challenge;
  isOwner: boolean;
  onToggleStatus: (status: 'active' | 'inactive') => void;
  onClose: () => void;
  onNavigateEdit: () => void;
}

export const ChallengeMetaSidebar = ({
  challenge,
  isOwner,
  onToggleStatus,
  onClose,
  onNavigateEdit,
}: ChallengeMetaSidebarProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Deadline card */}
      {challenge.deadline ? (
        <GlassCard hover={false}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-secondary" />
            <span className="text-xs font-semibold text-foreground">Deadline</span>
          </div>
          {isPast(new Date(challenge.deadline)) ? (
            <p className="text-sm font-medium text-red-400">Deadline passed</p>
          ) : (
            <p className="text-sm font-medium text-foreground">
              {formatDistanceToNow(new Date(challenge.deadline), { addSuffix: true })}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {new Date(challenge.deadline).toLocaleDateString()}
          </p>
        </GlassCard>
      ) : (
        <GlassCard hover={false}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-secondary" />
            <span className="text-xs font-semibold text-foreground">Deadline</span>
          </div>
          <p className="text-sm text-muted-foreground">Open-ended</p>
        </GlassCard>
      )}

      {/* Submissions stat card */}
      <GlassCard hover={false}>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-secondary" />
          <span className="text-xs font-semibold text-foreground">Submissions</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{challenge.submission_count}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          dataset{challenge.submission_count !== 1 ? 's' : ''} submitted
        </p>
      </GlassCard>

      {/* Share button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs"
        onClick={handleCopyLink}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-500" />
            Link Copied!
          </>
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5" />
            Copy Link
          </>
        )}
      </Button>

      {/* Compensation card */}
      <GlassCard hover={false}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-secondary" />
          <span className="text-xs font-semibold text-foreground">Compensation</span>
        </div>
        {challenge.compensation_amount === 0 ? (
          <p className="text-lg font-bold text-primary">Volunteer</p>
        ) : (
          <>
            <p className="text-2xl font-bold text-foreground">
              ${challenge.compensation_amount.toLocaleString()} {challenge.currency}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {challenge.compensation_per === 'challenge' ? 'Total budget (lump sum)' : 'Per accepted dataset'}
            </p>
          </>
        )}
      </GlassCard>

      {/* Owner controls */}
      {isOwner && challenge.status !== 'closed' && (
        <GlassCard hover={false}>
          <p className="text-xs font-semibold text-foreground mb-3">Manage Challenge</p>
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={onNavigateEdit}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Challenge
            </Button>
            {challenge.status === 'active' && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => onToggleStatus('inactive')}
              >
                <ToggleLeft className="h-3.5 w-3.5" /> Deactivate
              </Button>
            )}
            {challenge.status === 'inactive' && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs"
                onClick={() => onToggleStatus('active')}
              >
                <ToggleRight className="h-3.5 w-3.5" /> Reactivate
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs text-destructive hover:text-destructive"
                >
                  <XCircle className="h-3.5 w-3.5" /> Close Permanently
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close this challenge?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is permanent. The challenge will no longer accept submissions and cannot be reopened.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClose}>Close Challenge</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default ChallengeMetaSidebar;
