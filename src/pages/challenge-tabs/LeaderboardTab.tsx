import GlassCard from '@/components/GlassCard';
import { Trophy } from 'lucide-react';

export const LeaderboardTab = () => {
  return (
    <div className="space-y-4">
      <GlassCard hover={false}>
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="h-5 w-5 text-secondary" />
          <h2 className="text-sm font-semibold text-foreground">Leaderboard</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          A leaderboard will be available here once the challenge creator configures the scoring
          model and accepted submissions are ranked.
        </p>
      </GlassCard>
    </div>
  );
};

export default LeaderboardTab;
