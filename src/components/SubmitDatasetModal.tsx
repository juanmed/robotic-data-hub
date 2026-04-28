import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";
import { listDatasets } from "@/services/datasetService";
import { challengeSubmissionService } from "@/services/challengeSubmissionService";
import type { ChallengeSubmission } from "@/types";
import { toast } from "sonner";

interface SubmitDatasetModalProps {
  open: boolean;
  onClose: () => void;
  challengeId: string;
  existingSubmissions: ChallengeSubmission[];
  onSubmitted: () => void;
}

const SubmitDatasetModal = ({
  open, onClose, challengeId, existingSubmissions, onSubmitted,
}: SubmitDatasetModalProps) => {
  const [datasets, setDatasets] = useState<{ id: string; display_name: string }[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listDatasets().then((all) => {
      const alreadySubmittedIds = new Set(existingSubmissions.map((s) => s.dataset_id));
      const eligible = all
        .filter((d: any) => d.status === "ready" && !alreadySubmittedIds.has(d.id));
      setDatasets(eligible.map((d: any) => ({ id: d.id, display_name: d.display_name })));
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [open, existingSubmissions]);

  const handleSubmit = async () => {
    if (!selectedDatasetId) return;
    setSubmitting(true);
    try {
      await challengeSubmissionService.submit({
        challenge_id: challengeId,
        dataset_id: selectedDatasetId,
        message: message.trim(),
      });
      toast.success("Dataset submitted to challenge!");
      onSubmitted();
      onClose();
      setSelectedDatasetId("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Send className="h-5 w-5 text-secondary" />
            Submit Dataset
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Propose one of your datasets as a solution to this challenge.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Select Dataset</Label>
            {loading ? (
              <div className="h-10 rounded-xl bg-muted/20 animate-pulse" />
            ) : datasets.length === 0 ? (
              <p className="text-[11px] text-muted-foreground bg-muted/20 rounded-xl p-3">
                No eligible datasets. You need a dataset with "ready" status that hasn't already been submitted to this challenge.
              </p>
            ) : (
              <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dataset..." />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="submit-msg" className="text-xs">Message (optional)</Label>
            <Textarea
              id="submit-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain how your dataset meets the challenge requirements..."
              rows={3}
            />
          </div>

          <Button
            variant="neon"
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={submitting || !selectedDatasetId}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Submitting..." : "Submit Dataset"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitDatasetModal;
