import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageContainer from "@/layouts/PageContainer";
import SectionHeader from "@/components/SectionHeader";
import GlassCard from "@/components/GlassCard";
import DatasetListCard from "@/components/DatasetListCard";
import ChallengeListCard from "@/components/ChallengeListCard";
import { listDatasets } from "@/services/datasetService";
import { challengeService } from "@/services/challengeService";
import { challengeSubmissionService } from "@/services/challengeSubmissionService";
import type { DatasetListItem } from "@/services/datasetService";
import type { Challenge, ParticipantSubmissionItem } from "@/types";
import { formatPrice } from "@/lib/marketplace";
import { Layers, HardDrive, Database, Target, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<ParticipantSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [closeConfirmId, setCloseConfirmId] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      listDatasets(),
      challengeService.listMine(),
      challengeSubmissionService.listMineEnriched(),
    ]).then(([dsResult, chResult, subResult]) => {
      if (dsResult.status === "fulfilled") setDatasets(dsResult.value);
      else console.error("Dashboard datasets error:", dsResult.reason);

      if (chResult.status === "fulfilled") setChallenges(chResult.value);
      else console.warn("Dashboard challenges error (table may not exist yet):", chResult.reason);

      if (subResult.status === "fulfilled") setSubmissions(subResult.value);
      else console.warn("Dashboard challenge submissions error:", subResult.reason);
    }).finally(() => setLoading(false));
  }, []);

  const totalSize = datasets.reduce((a, d) => a + d.total_size_bytes, 0);

  const stats = [
    { icon: Database, label: "Datasets", value: datasets.length },
    { icon: Layers, label: "Total Files", value: datasets.reduce((a, d) => a + d.file_count, 0) },
    { icon: HardDrive, label: "Total Data", value: formatBytes(totalSize) },
    { icon: Target, label: "Challenges", value: challenges.length },
  ];

  const handlePublish = async (id: string) => {
    try {
      await challengeService.publish(id);
      setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, status: "active" as const } : c));
      toast.success("Challenge published!");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    }
  };

  const handleToggleStatus = async (id: string, status: "active" | "inactive") => {
    try {
      await challengeService.setStatus(id, status);
      setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
      toast.success(`Challenge ${status === "active" ? "activated" : "deactivated"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleClose = async (id: string) => {
    try {
      await challengeService.setStatus(id, "closed");
      setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, status: "closed" as const } : c));
      toast.success("Challenge closed");
    } catch (err: any) {
      toast.error(err.message || "Failed to close");
    }
    setCloseConfirmId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await challengeService.deleteDraft(id);
      setChallenges((prev) => prev.filter((c) => c.id !== id));
      toast.success("Draft deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleWithdraw = async (id: string) => {
    try {
      await challengeSubmissionService.withdraw(id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Submission withdrawn");
    } catch (err: any) {
      toast.error(err.message || "Failed to withdraw submission");
    }
  };

  const groupedSubmissions = submissions.reduce((acc, item) => {
    const key = item.challenge?.id || item.challenge_id;
    if (!acc[key]) {
      acc[key] = {
        challengeId: item.challenge_id,
        challengeTitle: item.challenge?.title || "Unknown challenge",
        challengeCompensationAmount: item.challenge?.compensation_amount ?? 0,
        challengeCompensationPer: item.challenge?.compensation_per ?? "dataset",
        challengeCurrency: item.challenge?.currency ?? "USD",
        entries: [] as ParticipantSubmissionItem[],
      };
    }
    acc[key].entries.push(item);
    return acc;
  }, {} as Record<string, {
    challengeId: string;
    challengeTitle: string;
    challengeCompensationAmount: number;
    challengeCompensationPer: "dataset" | "challenge";
    challengeCurrency: string;
    entries: ParticipantSubmissionItem[];
  }>);

  return (
    <PageContainer>
      <SectionHeader title="Dashboard" subtitle="Overview of your robotics data platform." />

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted/20 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map(({ icon: Icon, label, value }) => (
              <GlassCard key={label} hover={false}>
                <Icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </GlassCard>
            ))}
          </div>

          {/* Datasets */}
          <SectionHeader title="Datasets" className="mb-6" />
          {datasets.length === 0 ? (
            <GlassCard hover={false} className="text-center py-12">
              <Database className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No datasets yet. Upload one using the CLI and an upload key from the{" "}
                <Link to="/keys" className="text-primary hover:underline">Keys</Link> page.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {datasets.map((ds) => (
                <DatasetListCard key={ds.id} ds={ds} />
              ))}
            </div>
          )}

          {/* Challenges */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <SectionHeader title="Challenges" className="mb-0" />
              <Button
                variant="neon"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate("/dashboard/challenges/new")}
                data-testid="create-challenge-btn"
              >
                <Plus className="h-3.5 w-3.5" /> Create Challenge
              </Button>
            </div>
            {challenges.length === 0 ? (
              <GlassCard hover={false} className="text-center py-12">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No challenges yet. Create one to request datasets from the community.
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {challenges.map((ch) => (
                  <ChallengeListCard
                    key={ch.id}
                    challenge={ch}
                    onPublish={handlePublish}
                    onToggleStatus={handleToggleStatus}
                    onClose={(id) => setCloseConfirmId(id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* My Submissions */}
          <div className="mt-12">
            <SectionHeader title="My Submissions" className="mb-6" />
            {Object.keys(groupedSubmissions).length === 0 ? (
              <GlassCard hover={false} className="text-center py-12">
                <Send className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  You have not submitted any datasets to challenges yet.
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {Object.values(groupedSubmissions).map((group) => (
                  <GlassCard key={group.challengeId} hover={false}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Link
                        to={`/marketplace/challenges/${group.challengeId}`}
                        className="text-sm font-semibold text-foreground hover:text-secondary transition-colors"
                      >
                        {group.challengeTitle}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">
                        {group.entries.length} submission{group.entries.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.entries.map((sub) => (
                        <div
                          key={sub.id}
                          className="rounded-xl border border-border/30 bg-background/30 p-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">
                              {sub.dataset_display_name || sub.dataset_id}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Submitted {new Date(sub.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] mt-1">
                              Status:{" "}
                              <span className={
                                sub.status === "accepted"
                                  ? "text-green-400"
                                  : sub.status === "rejected"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }>
                                {sub.status}
                              </span>
                            </p>
                            {sub.status === "accepted" && (
                              <p className="text-[10px] text-green-400 mt-1">
                                Earned {formatPrice(group.challengeCompensationAmount, group.challengeCurrency)}{" "}
                                {group.challengeCompensationPer === "challenge" ? "(lump sum)" : "per accepted dataset"}
                              </p>
                            )}
                          </div>
                          {sub.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleWithdraw(sub.id)}
                            >
                              Withdraw
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Close confirmation dialog */}
      <AlertDialog open={!!closeConfirmId} onOpenChange={() => setCloseConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent. The challenge will no longer accept submissions and cannot be reopened.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => closeConfirmId && handleClose(closeConfirmId)}>
              Close Challenge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default DashboardPage;
