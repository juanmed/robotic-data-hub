import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { challengeService } from '@/services/challengeService';
import type { Challenge } from '@/types';
import { toast } from 'sonner';

interface OutletContextType {
  challenge: Challenge;
  isOwner: boolean;
  onFieldSaved: (updated: Partial<Challenge>) => void;
}

export const RulesTab = () => {
  const { challenge, isOwner, onFieldSaved } = useOutletContext<OutletContextType>();
  const [localConstraints, setLocalConstraints] = useState(challenge?.constraints ?? '');
  const [localConditions, setLocalConditions] = useState(challenge?.conditions ?? '');
  const [savingConstraints, setSavingConstraints] = useState(false);
  const [savingConditions, setSavingConditions] = useState(false);

  const saveConstraints = async () => {
    if (localConstraints === challenge.constraints) return;
    setSavingConstraints(true);
    try {
      await challengeService.update(challenge.id, { constraints: localConstraints });
      onFieldSaved({ constraints: localConstraints });
      toast.success('Constraints saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save constraints');
      setLocalConstraints(challenge.constraints);
    } finally {
      setSavingConstraints(false);
    }
  };

  const saveConditions = async () => {
    if (localConditions === challenge.conditions) return;
    setSavingConditions(true);
    try {
      await challengeService.update(challenge.id, { conditions: localConditions });
      onFieldSaved({ conditions: localConditions });
      toast.success('Conditions saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save conditions');
      setLocalConditions(challenge.conditions);
    } finally {
      setSavingConditions(false);
    }
  };

  const bothEmpty = !localConstraints?.trim() && !localConditions?.trim();

  if (!isOwner && bothEmpty) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">No rules specified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Technical Constraints */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Technical Constraints</h3>
        {isOwner ? (
          <MarkdownEditor
            value={localConstraints}
            onChange={setLocalConstraints}
            onBlur={saveConstraints}
            placeholder="Robot type, sensor requirements, data format..."
            showSaveButton={true}
          />
        ) : (
          <MarkdownEditor readOnly value={localConstraints} />
        )}
      </div>

      {/* Acceptance Conditions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Acceptance Conditions</h3>
        {isOwner ? (
          <MarkdownEditor
            value={localConditions}
            onChange={setLocalConditions}
            onBlur={saveConditions}
            placeholder="Success criteria, quality requirements..."
            showSaveButton={true}
          />
        ) : (
          <MarkdownEditor readOnly value={localConditions} />
        )}
      </div>
    </div>
  );
};

export default RulesTab;
