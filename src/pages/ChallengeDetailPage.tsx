import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { formatPrice } from "@/lib/marketplace";
import { challengeService } from "@/services/challengeService";
import { challengeMediaService } from "@/services/challengeMediaService";
import { challengeSubmissionService } from "@/services/challengeSubmissionService";
import { getDatasetFileUrls, type SignedFileUrl } from "@/services/datasetService";
import { openVisualizer } from "@/lib/visualizer";
import { useAuth } from "@/hooks/useAuth";
import SubmitDatasetModal from "@/components/SubmitDatasetModal";
import ChallengeStatusBadge from "@/components/ChallengeStatusBadge";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type {
  Challenge,
  ChallengeMedia,
  ChallengeSubmission,
  ChallengeSubmissionEnriched,
} from "@/types";
import { toast } from "sonner";
import {
  Target, Trophy, Clock, User, Tag, Send, ToggleLeft, ToggleRight,
  XCircle, ArrowLeft, Film, Image as ImageIcon, CheckCircle2, XIcon,
  MessageSquare, Calendar, AlertTriangle, Pencil, Eye, Download,
} from "lucide-react";

const ChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [media, setMedia] = useState<ChallengeMedia[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(new Map());
  const [ownerSubmissions, setOwnerSubmissions] = useState<ChallengeSubmissionEnriched[]>([]);
  const [mySubmissions, setMySubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<string | null>(null);
  const [filesOpen, setFilesOpen] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedSubmissionName, setSelectedSubmissionName] = useState<string>("");
  const [submissionFiles, setSubmissionFiles] = useState<SignedFileUrl[]>([]);

  const isOwner = !!(user && challenge && user.id === challenge.user_id);
  const isActive = challenge?.status === "active";
  const isClosed = challenge?.status === "closed" || challenge?.status === "inactive";
  const backTo = location.pathname.startsWith("/dashboard") ? "/dashboard" : "/marketplace?tab=challenges";

  useEffect(() => {
    if (!id) return;
    Promise.all([
      challengeService.get(id),
      challengeMediaService.list(id),
    ]).then(([ch, med]) => {
      setChallenge(ch ?? null);
      setMedia(med);
      if (med.length > 0) setActiveMedia(med[0].id);
      med.forEach((m) => {
        challengeMediaService.getSignedUrl(m.storage_path).then((url) => {
          setMediaUrls((prev) => new Map(prev).set(m.id, url));
        });
      });
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    if (isAuthenticated) {
      challengeSubmissionService
        .listMine()
        .then((rows) => setMySubmissions(rows.filter((row) => row.challenge_id === id)))
        .catch(() => setMySubmissions([]));
    } else {
      setMySubmissions([]);
    }

    if (!isOwner) {
      setOwnerSubmissions([]);
      return;
    }
    challengeSubmissionService
      .listForChallengeEnriched(id)
      .then(setOwnerSubmissions)
      .catch(() => setOwnerSubmissions([]));
  }, [id, isOwner, isAuthenticated]);

  const refreshSubmissions = () => {
    if (!id) return;

    if (isAuthenticated) {
      challengeSubmissionService
        .listMine()
        .then((rows) => setMySubmissions(rows.filter((row) => row.challenge_id === id)))
        .catch(() => setMySubmissions([]));
    }

    if (isOwner) {
      challengeSubmissionService
        .listForChallengeEnriched(id)
        .then(setOwnerSubmissions)
        .catch(() => setOwnerSubmissions([]));
    }
  };

  const handleToggleStatus = async (status: "active" | "inactive") => {
    if (!challenge) return;
    try {
      const updated = await challengeService.setStatus(challenge.id, status);
      setChallenge(updated);
      toast.success(`Challenge ${status === "active" ? "activated" : "deactivated"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleClose = async () => {
    if (!challenge) return;
    try {
      const updated = await challengeService.setStatus(challenge.id, "closed");
      setChallenge(updated);
      toast.success("Challenge closed permanently");
    } catch (err: any) {
      toast.error(err.message || "Failed to close");
    }
  };

  const handleSubmissionAction = async (subId: string, status: "accepted" | "rejected") => {
    try {
      await challengeSubmissionService.updateStatus(subId, status);
      refreshSubmissions();
      toast.success(`Submission ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleVisualizeSubmission = async (datasetId: string) => {
    try {
      await openVisualizer(datasetId);
    } catch (err: any) {
      toast.error(err.message || "Failed to open visualizer");
    }
  };

  const handleOpenAcceptedFiles = async (datasetId: string, datasetName: string | null) => {
    setFilesOpen(true);
    setFilesLoading(true);
    setSelectedSubmissionName(datasetName || datasetId);
    setSubmissionFiles([]);
    try {
      const urls = await getDatasetFileUrls(datasetId);
      setSubmissionFiles(urls.filter((u) => !!u.signed_url));
    } catch (err: any) {
      toast.error(err.message || "Failed to load downloadable files");
    } finally {
      setFilesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-background">
        <div className="container mx-auto px-6 pt-16">
          <div className="h-8 w-48 rounded-xl bg-muted/20 animate-pulse mb-6" />
          <div className="h-96 rounded-2xl bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen pt-16 bg-background flex items-center justify-center">
        <div className="text-center">
          <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Challenge not found.</p>
          <Link to={backTo} className="text-primary text-sm hover:underline mt-2 inline-block">
            Back
          </Link>
        </div>
      </div>
    );
  }

  const deadlineDate = challenge.deadline ? new Date(challenge.deadline) : null;
  const deadlinePassed = deadlineDate ? deadlineDate.getTime() < Date.now() : false;
  const isLumpSum = challenge.compensation_per === "challenge";

  const activeMediaItem = media.find((m) => m.id === activeMedia);
  const activeMediaUrl = activeMedia ? mediaUrls.get(activeMedia) : null;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="container mx-auto px-6 pt-8 pb-20">
        {/* Back link */}
        <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> {location.pathname.startsWith("/dashboard") ? "Back to Dashboard" : "Back to Challenges"}
        </Link>

        {/* Status banner */}
        {isClosed && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 mb-6">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <p className="text-sm text-yellow-400">This challenge is no longer accepting submissions.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-secondary/15 text-secondary border border-secondary/25">
                  <Target className="h-2.5 w-2.5" /> Challenge
                </span>
                <ChallengeStatusBadge status={challenge.status} />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{challenge.title}</h1>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Created {new Date(challenge.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {challenge.submission_count} submission{challenge.submission_count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Media gallery */}
            {media.length > 0 && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
                  <div className="aspect-video flex items-center justify-center bg-muted/20">
                    {activeMediaUrl && activeMediaItem ? (
                      activeMediaItem.content_type.startsWith("video/") ? (
                        <video
                          key={activeMediaUrl}
                          src={activeMediaUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img src={activeMediaUrl} alt={activeMediaItem.file_name} className="w-full h-full object-contain" />
                      )
                    ) : (
                      <Film className="h-12 w-12 text-muted-foreground/20" />
                    )}
                  </div>
                </div>
                {media.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {media.map((m) => {
                      const url = mediaUrls.get(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => setActiveMedia(m.id)}
                          className={`shrink-0 w-20 h-14 rounded-lg border overflow-hidden transition-all ${
                            activeMedia === m.id ? "border-secondary ring-1 ring-secondary/50" : "border-border/30 opacity-60 hover:opacity-100"
                          }`}
                        >
                          {url ? (
                            m.content_type.startsWith("video/") ? (
                              <video src={url} muted preload="metadata" className="w-full h-full object-cover"
                                onLoadedData={(e) => { e.currentTarget.currentTime = 0.1; }} />
                            ) : (
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            )
                          ) : (
                            <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                              <Film className="h-3 w-3 text-muted-foreground/30" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <GlassCard hover={false}>
              <h2 className="text-sm font-semibold text-foreground mb-3">Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {challenge.description || "No description provided."}
              </p>
            </GlassCard>

            {/* Constraints */}
            {challenge.constraints && (
              <GlassCard hover={false}>
                <h2 className="text-sm font-semibold text-foreground mb-3">Technical Constraints</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {challenge.constraints}
                </p>
              </GlassCard>
            )}

            {/* Conditions */}
            {challenge.conditions && (
              <GlassCard hover={false}>
                <h2 className="text-sm font-semibold text-foreground mb-3">Acceptance Conditions</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {challenge.conditions}
                </p>
              </GlassCard>
            )}

            {/* Tags */}
            {challenge.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {challenge.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-medium bg-muted/40 text-muted-foreground border border-border/30">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Owner: Submissions */}
            {isOwner && ownerSubmissions.length > 0 && (
              <GlassCard hover={false}>
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  Submissions ({ownerSubmissions.length})
                </h2>
                <div className="space-y-3">
                  {ownerSubmissions.map((sub) => (
                    <div key={sub.id} className="rounded-xl border border-border/30 bg-background/30 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {sub.dataset_display_name || sub.dataset_id}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Dataset ID: <span className="font-mono">{sub.dataset_id}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Submitter: {sub.submitter_name || sub.submitter_id}
                        </p>
                        {sub.message && (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{sub.message}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(sub.created_at).toLocaleDateString()} &middot;{" "}
                          <span className={
                            sub.status === "accepted" ? "text-green-400" :
                            sub.status === "rejected" ? "text-red-400" : "text-yellow-400"
                          }>
                            {sub.status}
                          </span>
                        </p>
                        {sub.status === "accepted" && (
                          <p className="text-[10px] text-green-400 mt-1">
                            Accepted payout: {formatPrice(challenge.compensation_amount, challenge.currency)}{" "}
                            {challenge.compensation_per === "challenge" ? "(lump sum)" : "per dataset"}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-[10px]"
                          onClick={() => handleVisualizeSubmission(sub.dataset_id)}
                        >
                          <Eye className="h-3 w-3" /> Visualize
                        </Button>
                        {sub.status === "accepted" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-[10px]"
                            onClick={() => handleOpenAcceptedFiles(sub.dataset_id, sub.dataset_display_name)}
                          >
                            <Download className="h-3 w-3" /> Access Files
                          </Button>
                        )}
                        {sub.status === "pending" && (
                          <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-[10px] text-green-400 hover:text-green-400"
                            onClick={() => handleSubmissionAction(sub.id, "accepted")}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Accept
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-[10px] text-red-400 hover:text-red-400"
                            onClick={() => handleSubmissionAction(sub.id, "rejected")}
                          >
                            <XIcon className="h-3 w-3" /> Reject
                          </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Compensation card */}
            <GlassCard hover={false}>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-secondary" />
                <span className="text-xs font-semibold text-foreground">Compensation</span>
              </div>
              {challenge.compensation_amount === 0 ? (
                <p className="text-lg font-bold text-primary">Volunteer</p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    {formatPrice(challenge.compensation_amount, challenge.currency)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {isLumpSum ? "Total budget (lump sum)" : "Per accepted dataset"}
                  </p>
                </>
              )}
            </GlassCard>

            {/* Deadline card */}
            <GlassCard hover={false}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-secondary" />
                <span className="text-xs font-semibold text-foreground">Deadline</span>
              </div>
              {deadlineDate ? (
                <>
                  <p className={`text-sm font-semibold ${deadlinePassed ? "text-red-400" : "text-foreground"}`}>
                    {deadlineDate.toLocaleDateString()}
                  </p>
                  {deadlinePassed && (
                    <p className="text-[10px] text-red-400 mt-1">Deadline has passed</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No deadline</p>
              )}
            </GlassCard>

            {/* Submit button */}
            {isAuthenticated && isActive && (
              <Button
                variant="neon"
                className="w-full gap-2"
                onClick={() => setSubmitOpen(true)}
              >
                <Send className="h-4 w-4" /> Submit Dataset
              </Button>
            )}

            {!isAuthenticated && isActive && (
              <Link to="/login">
                <Button variant="neon" className="w-full gap-2">
                  <User className="h-4 w-4" /> Sign in to Submit
                </Button>
              </Link>
            )}

            {/* Owner controls */}
            {isOwner && challenge.status !== "closed" && (
              <GlassCard hover={false}>
                <p className="text-xs font-semibold text-foreground mb-3">Manage Challenge</p>
                <div className="space-y-2">
                  <Link to={`/dashboard/challenges/${challenge.id}/edit`} className="block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit Challenge
                    </Button>
                  </Link>
                  {challenge.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => handleToggleStatus("inactive")}
                    >
                      <ToggleLeft className="h-3.5 w-3.5" /> Deactivate
                    </Button>
                  )}
                  {challenge.status === "inactive" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => handleToggleStatus("active")}
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
                        <AlertDialogAction onClick={handleClose}>Close Challenge</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* Submit modal */}
      <SubmitDatasetModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        challengeId={challenge.id}
        existingSubmissions={mySubmissions}
        onSubmitted={refreshSubmissions}
      />

      <Dialog open={filesOpen} onOpenChange={setFilesOpen}>
        <DialogContent className="sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Accepted Submission Files</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedSubmissionName}
            </DialogDescription>
          </DialogHeader>
          {filesLoading ? (
            <div className="h-24 rounded-xl bg-muted/20 animate-pulse" />
          ) : submissionFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No downloadable files available.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {submissionFiles.map((file) => (
                <div
                  key={file.relative_path}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-background/30 p-2.5"
                >
                  <span className="text-[11px] font-mono text-foreground truncate">{file.relative_path}</span>
                  <a href={file.signed_url ?? "#"} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]">Download</Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChallengeDetailPage;
