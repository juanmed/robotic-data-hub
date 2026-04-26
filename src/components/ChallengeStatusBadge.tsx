import type { Challenge } from "@/types";

const STATUS_STYLES: Record<Challenge["status"], { label: string; classes: string }> = {
  draft: { label: "Draft", classes: "border-muted-foreground/30 bg-muted/20 text-muted-foreground" },
  active: { label: "Active", classes: "border-green-500/30 bg-green-500/10 text-green-400" },
  inactive: { label: "Inactive", classes: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" },
  closed: { label: "Closed", classes: "border-red-500/30 bg-red-500/10 text-red-400" },
};

const ChallengeStatusBadge = ({ status }: { status: Challenge["status"] }) => {
  const { label, classes } = STATUS_STYLES[status];
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${classes}`}
      data-testid="challenge-status-badge"
    >
      {label}
    </span>
  );
};

export default ChallengeStatusBadge;
