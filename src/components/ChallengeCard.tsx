import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/marketplace";
import type { EnrichedChallenge } from "@/types";
import {
  Target, Trophy, User, ArrowRight, Calendar, Clock,
  Tag, MessageSquare, Film,
} from "lucide-react";

function deadlineLabel(deadline: string | null): { text: string; urgent: boolean } {
  if (!deadline) return { text: "No deadline", urgent: false };
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  if (diffMs < 0) return { text: "Deadline passed", urgent: true };
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 3) return { text: `${days}d left`, urgent: true };
  return { text: `${days}d left`, urgent: false };
}

const ChallengeCard = ({ challenge }: { challenge: EnrichedChallenge }) => {
  const { text: deadlineText, urgent } = deadlineLabel(challenge.deadline);
  const isLumpSum = challenge.compensation_per === "challenge";

  return (
    <Link to={`/marketplace/challenges/${challenge.id}`} className="group block" data-testid="challenge-card">
      <div className="relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-secondary/40 hover:shadow-[0_0_40px_hsl(var(--secondary)/0.12)] hover:-translate-y-1">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Thumbnail */}
        <div className="relative h-44 overflow-hidden bg-muted/20 flex items-center justify-center">
          {challenge.preview_url ? (
            challenge.preview_url.match(/\.(mp4|webm|avi)/) ? (
              <video
                src={challenge.preview_url}
                muted
                preload="metadata"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onLoadedData={(e) => { e.currentTarget.currentTime = 0.1; }}
              />
            ) : (
              <img
                src={challenge.preview_url}
                alt={challenge.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )
          ) : (
            <Target className="h-10 w-10 text-muted-foreground/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

          {/* Challenge badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-secondary/20 text-secondary border border-secondary/30 backdrop-blur-sm">
              <Target className="h-2.5 w-2.5" /> Challenge
            </span>
          </div>

          {/* Compensation badge */}
          <div className="absolute top-3 right-3">
            {challenge.compensation_amount === 0 ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm shadow-[0_0_12px_hsl(var(--primary)/0.3)]">
                Volunteer
              </span>
            ) : (
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider backdrop-blur-sm shadow-[0_0_12px_hsl(var(--secondary)/0.3)] ${
                isLumpSum
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-green-500/20 text-green-400 border border-green-500/30"
              }`}>
                {formatPrice(challenge.compensation_amount, challenge.currency)}
                <span className="text-[8px] ml-1 opacity-70">
                  {isLumpSum ? "total" : "/dataset"}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-secondary transition-colors">
            {challenge.title}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {challenge.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {challenge.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-muted/40 text-muted-foreground border border-border/30">
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/20">
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {challenge.creator_name}
              </span>
              <span className={`flex items-center gap-1 ${urgent ? "text-red-400" : ""}`}>
                <Clock className="h-3 w-3" /> {deadlineText}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {challenge.submission_count}
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ChallengeCard;
