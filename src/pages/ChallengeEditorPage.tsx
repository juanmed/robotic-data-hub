import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import ChallengeMediaUpload from "@/components/ChallengeMediaUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, formatPrice, getCurrency,
} from "@/lib/marketplace";
import type { CurrencyCode } from "@/lib/marketplace";
import { challengeService } from "@/services/challengeService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Target, Save, Send, ArrowLeft, ArrowRight, CheckCircle2, Loader2,
} from "lucide-react";

const STEPS = ["Basic Info", "Media", "Compensation", "Review & Publish"] as const;

const ChallengeEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(id ?? null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [compensationAmount, setCompensationAmount] = useState("");
  const [compensationPer, setCompensationPer] = useState<"dataset" | "challenge">("dataset");
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [isVolunteer, setIsVolunteer] = useState(true);
  const [deadline, setDeadline] = useState("");
  const [constraints, setConstraints] = useState("");
  const [conditions, setConditions] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "inactive" | "closed">("draft");

  useEffect(() => {
    if (id) {
      challengeService.get(id).then((c) => {
        if (!c) { navigate("/dashboard"); return; }
        setTitle(c.title);
        setDescription(c.description);
        setIsVolunteer(c.compensation_amount === 0);
        if (c.compensation_amount > 0) {
          const cur = getCurrency(c.currency);
          setCompensationAmount(
            cur.decimals > 0
              ? (c.compensation_amount / Math.pow(10, cur.decimals)).toFixed(cur.decimals)
              : c.compensation_amount.toString()
          );
        }
        setCompensationPer(c.compensation_per);
        setCurrency(c.currency as CurrencyCode);
        setDeadline(c.deadline ? c.deadline.split("T")[0] : "");
        setConstraints(c.constraints);
        setConditions(c.conditions);
        setTagInput(c.tags.join(", "));
        setStatus(c.status);
        setLoading(false);
      });
    }
  }, [id, navigate]);

  const currencyInfo = getCurrency(currency);
  const priceAmount = isVolunteer
    ? 0
    : Math.round(parseFloat(compensationAmount || "0") * Math.pow(10, currencyInfo.decimals));

  const formData = () => ({
    title: title.trim(),
    description: description.trim(),
    compensation_amount: priceAmount,
    compensation_per: compensationPer,
    currency,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    constraints: constraints.trim(),
    conditions: conditions.trim(),
    tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean),
  });

  const handleSaveDraft = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      if (challengeId) {
        await challengeService.update(challengeId, formData());
        toast.success("Draft saved");
      } else {
        const created = await challengeService.create(formData());
        setChallengeId(created.id);
        navigate(`/dashboard/challenges/${created.id}/edit`, { replace: true });
        toast.success("Challenge created as draft");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const canPublish = title.trim() && description.trim();

  const handlePublish = async () => {
    if (!canPublish) { toast.error("Title and description are required"); return; }
    setPublishing(true);
    try {
      let cid = challengeId;
      if (!cid) {
        const created = await challengeService.create(formData());
        cid = created.id;
      } else {
        await challengeService.update(cid, formData());
      }
      await challengeService.publish(cid);
      toast.success("Challenge published!");
      navigate(`/marketplace/challenges/${cid}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <div className="h-10 w-48 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-64 rounded-2xl bg-muted/20 animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        <SectionHeader
          title={isNew ? "Create Challenge" : "Edit Challenge"}
          subtitle="Request datasets from the community to automate new tasks."
        />

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-colors ${
                i === step
                  ? "border-secondary/50 bg-secondary/10 text-secondary"
                  : i < step
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border/40 bg-background/40 text-muted-foreground"
              }`}
            >
              {i < step ? <CheckCircle2 className="h-3 w-3" /> : <span className="w-3 text-center">{i + 1}</span>}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 0 && (
          <GlassCard hover={false}>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="ch-title" className="text-xs">Title *</Label>
                <Input
                  id="ch-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Kitchen object manipulation dataset"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ch-desc" className="text-xs">Description *</Label>
                <Textarea
                  id="ch-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the task you want automated, the environment, objects involved, success criteria..."
                  rows={6}
                />
              </div>
            </div>
          </GlassCard>
        )}

        {/* Step 2: Media */}
        {step === 1 && (
          <GlassCard hover={false}>
            <div className="space-y-3">
              <Label className="text-xs">Upload Videos & Images</Label>
              <p className="text-[11px] text-muted-foreground">
                Show the task you want automated. Videos and images help contributors understand the challenge.
              </p>
              {challengeId && user ? (
                <ChallengeMediaUpload challengeId={challengeId} userId={user.id} />
              ) : (
                <p className="text-[11px] text-muted-foreground bg-muted/20 rounded-xl p-4 text-center">
                  Save as draft first to upload media.
                </p>
              )}
            </div>
          </GlassCard>
        )}

        {/* Step 3: Compensation & Conditions */}
        {step === 2 && (
          <GlassCard hover={false}>
            <div className="space-y-5">
              {/* Compensation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Compensation</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Volunteer (no pay)</span>
                    <Switch checked={isVolunteer} onCheckedChange={setIsVolunteer} />
                  </div>
                </div>

                {!isVolunteer && (
                  <>
                    <div className="grid grid-cols-[1fr_auto_auto] gap-3">
                      <Input
                        type="number"
                        min="0"
                        step={currencyInfo.decimals > 0 ? "0.01" : "1"}
                        value={compensationAmount}
                        onChange={(e) => setCompensationAmount(e.target.value)}
                        placeholder="0.00"
                        className="font-mono"
                      />
                      <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.symbol} {c.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={compensationPer} onValueChange={(v) => setCompensationPer(v as "dataset" | "challenge")}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dataset">Per dataset</SelectItem>
                          <SelectItem value="challenge">Lump sum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {priceAmount > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        {compensationPer === "dataset"
                          ? `Each accepted dataset earns the contributor ${formatPrice(priceAmount, currency)}`
                          : `Total budget: ${formatPrice(priceAmount, currency)} for the winning submission`}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <Label htmlFor="ch-deadline" className="text-xs">Deadline (optional)</Label>
                <Input
                  id="ch-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              {/* Constraints */}
              <div className="space-y-1.5">
                <Label htmlFor="ch-constraints" className="text-xs">Technical Constraints</Label>
                <Textarea
                  id="ch-constraints"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="Robot type, sensor requirements, data format, minimum episodes..."
                  rows={3}
                />
              </div>

              {/* Conditions */}
              <div className="space-y-1.5">
                <Label htmlFor="ch-conditions" className="text-xs">Acceptance Conditions</Label>
                <Textarea
                  id="ch-conditions"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="Success criteria, quality requirements, what makes a dataset acceptable..."
                  rows={3}
                />
              </div>
            </div>
          </GlassCard>
        )}

        {/* Step 4: Tags & Review */}
        {step === 3 && (
          <GlassCard hover={false}>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="ch-tags" className="text-xs">Tags</Label>
                <Input
                  id="ch-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="manipulation, kitchen, depth (comma-separated)"
                />
              </div>

              {/* Pre-publish checklist */}
              <div className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground mb-2">Pre-publish checklist</p>
                <ChecklistItem ok={!!title.trim()} label="Title set" />
                <ChecklistItem ok={!!description.trim()} label="Description written" />
                <ChecklistItem ok={isVolunteer || priceAmount > 0} label="Compensation configured" />
                <ChecklistItem ok={!!constraints.trim() || !!conditions.trim()} label="Constraints or conditions specified" />
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-2 text-[11px]">
                <p className="text-xs font-semibold text-foreground mb-2">Summary</p>
                <Row label="Title" value={title || "—"} />
                <Row label="Compensation" value={
                  isVolunteer ? "Volunteer" :
                  `${formatPrice(priceAmount, currency)} ${compensationPer === "challenge" ? "(lump sum)" : "(per dataset)"}`
                } />
                <Row label="Deadline" value={deadline || "None"} />
                <Row label="Tags" value={tagInput || "None"} />
              </div>

              <Button
                variant="neon"
                className="w-full gap-2"
                onClick={handlePublish}
                disabled={publishing || !canPublish || status === "active"}
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {status === "active" ? "Already Published" : "Publish Challenge"}
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              disabled={saving || status !== "draft"}
              className="gap-1.5"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Draft
            </Button>
            {step < STEPS.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step + 1)}
                className="gap-1.5"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

const ChecklistItem = ({ ok, label }: { ok: boolean; label: string }) => (
  <div className="flex items-center gap-2 text-[11px]">
    <CheckCircle2 className={`h-3.5 w-3.5 ${ok ? "text-green-400" : "text-muted-foreground/30"}`} />
    <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium">{value}</span>
  </div>
);

export default ChallengeEditorPage;
