import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { User, Calendar, Trophy, Target, Database, ArrowLeft } from "lucide-react";
import { userProfileService } from "@/services/userProfileService";
import type { Challenge, PublicUserProfile, PublicUserProfileStats } from "@/types";

const DEFAULT_STATS: PublicUserProfileStats = {
  total_challenges_created: 0,
  total_successful_participations: 0,
  total_datasets_uploaded: 0,
};

const PublicUserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [stats, setStats] = useState<PublicUserProfileStats>(DEFAULT_STATS);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);

    Promise.all([
      userProfileService.getPublicProfile(id),
      userProfileService.getProfileStats(id),
      userProfileService.listPublicChallengesByUser(id),
    ])
      .then(([p, s, c]) => {
        if (cancelled) return;
        setProfile(p);
        setStats(s);
        setChallenges(c);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        setStats(DEFAULT_STATS);
        setChallenges([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-16 bg-background">
        <div className="container mx-auto px-6 pt-10 pb-20">
          <div className="h-24 rounded-2xl bg-muted/20 animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((k) => <div key={k} className="h-24 rounded-xl bg-muted/20 animate-pulse" />)}
          </div>
          <div className="h-72 rounded-2xl bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-16 bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">Public profile not found.</p>
          <Link to="/marketplace" className="text-primary hover:underline text-sm">Back to marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="container mx-auto px-6 pt-8 pb-20">
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="rounded-2xl border border-border/40 bg-card/60 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-muted/40 overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{profile.display_name}</h1>
              <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Member since {new Date(profile.member_since).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-border/40 bg-card/50 p-4">
            <p className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Challenges Created</p>
            <p className="text-2xl font-semibold">{stats.total_challenges_created}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/50 p-4">
            <p className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> Successful Participations</p>
            <p className="text-2xl font-semibold">{stats.total_successful_participations}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/50 p-4">
            <p className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" /> Datasets Uploaded</p>
            <p className="text-2xl font-semibold">{stats.total_datasets_uploaded}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Active Challenges</h2>
          {challenges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active challenges yet.</p>
          ) : (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <Link
                  key={challenge.id}
                  to={`/marketplace/challenges/${challenge.id}`}
                  className="block rounded-xl border border-border/30 p-4 hover:border-primary/40 transition-colors"
                >
                  <p className="font-medium text-foreground">{challenge.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{challenge.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicUserProfilePage;
