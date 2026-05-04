import GlassCard from '@/components/GlassCard';
import { MessageSquare } from 'lucide-react';

export const DiscussionTab = () => {
  return (
    <div className="space-y-4">
      <GlassCard hover={false}>
        <div className="flex items-center gap-3 mb-3">
          <MessageSquare className="h-5 w-5 text-secondary" />
          <h2 className="text-sm font-semibold text-foreground">Discussion</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Discussion threads are coming soon. Challenge participants and creators will be able to
          ask questions and share insights here.
        </p>
      </GlassCard>
    </div>
  );
};

export default DiscussionTab;
