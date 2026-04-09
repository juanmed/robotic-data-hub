import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/marketplace";
import ChallengeStatusBadge from "@/components/ChallengeStatusBadge";
import type { Challenge } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Target, Pencil, Trash2, Send, ToggleLeft, ToggleRight, XCircle, Clock, MessageSquare,
} from "lucide-react";

interface ChallengeListCardProps {
  challenge: Challenge;
  onPublish?: (id: string) => void;
  onToggleStatus?: (id: string, status: "active" | "inactive") => void;
  onClose?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ChallengeListCard = ({
  challenge,
  onPublish,
  onToggleStatus,
  onClose,
  onDelete,
}: ChallengeListCardProps) => {
  const deadlineText = challenge.deadline
    ? new Date(challenge.deadline).toLocaleDateString()
    : "No deadline";

  return (
    <div
      className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 transition-all duration-300 hover:border-secondary/30"
      data-testid="challenge-list-card"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
          <Target className="h-5 w-5 text-secondary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/dashboard/challenges/${challenge.id}`}
              className="text-sm font-semibold text-foreground hover:text-secondary transition-colors truncate"
            >
              {challenge.title}
            </Link>
            <ChallengeStatusBadge status={challenge.status} />
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span>
              {challenge.compensation_amount === 0
                ? "Volunteer"
                : `${formatPrice(challenge.compensation_amount, challenge.currency)} ${challenge.compensation_per === "challenge" ? "total" : "/dataset"}`}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {deadlineText}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> {challenge.submission_count} submissions
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-4">
        {challenge.status === "draft" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => onPublish?.(challenge.id)}
              data-testid="publish-btn"
            >
              <Send className="h-3.5 w-3.5" /> Publish
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
              onClick={() => onDelete?.(challenge.id)}
              data-testid="delete-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        {challenge.status === "active" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => onToggleStatus?.(challenge.id, "inactive")}
            data-testid="deactivate-btn"
          >
            <ToggleLeft className="h-3.5 w-3.5" /> Deactivate
          </Button>
        )}
        {challenge.status === "inactive" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => onToggleStatus?.(challenge.id, "active")}
            data-testid="activate-btn"
          >
            <ToggleRight className="h-3.5 w-3.5" /> Activate
          </Button>
        )}
        {challenge.status !== "closed" && (
          <>
            <Link to={`/dashboard/challenges/${challenge.id}`}>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" data-testid="edit-btn">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
              onClick={() => onClose?.(challenge.id)}
              data-testid="close-btn"
            >
              <XCircle className="h-3.5 w-3.5" /> Close
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChallengeListCard;
