import { useEffect, useState } from 'react';
import { useParams, Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { challengeService } from '@/services/challengeService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Challenge, OptionalTabKey } from '@/types';
import { OPTIONAL_TABS } from '@/types';
import ChallengeStatusBadge from '@/components/ChallengeStatusBadge';
import ChallengeMetaSidebar from '@/components/ChallengeMetaSidebar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Settings,
  ArrowLeft,
  Target,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Pencil,
  User,
} from 'lucide-react';

export const ChallengeLayout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [creatorName, setCreatorName] = useState<string>('Unknown');
  const [loading, setLoading] = useState(true);

  const isOwner = !!(user && challenge && user.id === challenge.user_id);
  const isClosed = challenge?.status === 'closed' || challenge?.status === 'inactive';
  const backTo = location.pathname.startsWith('/dashboard') ? '/dashboard' : '/marketplace?tab=challenges';

  // Load challenge and creator name
  useEffect(() => {
    if (!id) return;
    Promise.all([
      challengeService.get(id),
      (async () => {
        if (!id) return null;
        const ch = await challengeService.get(id);
        if (!ch) return null;
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', ch.user_id)
          .maybeSingle();
        return profile?.name ?? 'Unknown';
      })(),
    ])
      .then(([ch, creatorNameResult]) => {
        setChallenge(ch ?? null);
        setCreatorName(creatorNameResult ?? 'Unknown');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleTabToggle = async (key: OptionalTabKey, checked: boolean) => {
    if (!challenge) return;
    const current = challenge.enabled_tabs ?? [];
    const next = checked
      ? [...current, key]
      : current.filter((k) => k !== key);

    // Optimistic update
    const prevChallenge = challenge;
    setChallenge((prev) => (prev ? { ...prev, enabled_tabs: next } : prev));

    try {
      await challengeService.update(challenge.id, { enabled_tabs: next });
      toast.success('Tab settings updated');
    } catch (err) {
      // Revert on error
      setChallenge(prevChallenge);
      toast.error('Failed to update tab settings');
    }

    // If active tab was unchecked, navigate to overview
    const currentTab = location.pathname.split('/').pop();
    if (!checked && currentTab === key) {
      navigate('.', { relative: 'path' });
    }
  };

  const handleToggleStatus = async (status: 'active' | 'inactive') => {
    if (!challenge) return;
    try {
      const updated = await challengeService.setStatus(challenge.id, status);
      setChallenge(updated);
      toast.success(`Challenge ${status === 'active' ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleClose = async () => {
    if (!challenge) return;
    try {
      const updated = await challengeService.setStatus(challenge.id, 'closed');
      setChallenge(updated);
      toast.success('Challenge closed permanently');
    } catch (err: any) {
      toast.error(err.message || 'Failed to close');
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
          <button
            onClick={() => navigate(backTo)}
            className="text-primary text-sm hover:underline mt-2 inline-block"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Visible tabs: Overview and Submissions always shown, plus enabled optional tabs
  const enabledTabs = challenge.enabled_tabs ?? [];
  const visibleTabs = [
    { to: 'overview', label: 'Overview', key: undefined },
    { to: 'submissions', label: 'Submissions', key: undefined },
    ...OPTIONAL_TABS.filter((t) => enabledTabs.includes(t.key)).map((t) => ({
      to: t.key,
      label: t.label,
      key: t.key,
    })),
  ];

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="container mx-auto px-6 pt-8 pb-20">
        {/* Back link */}
        <button
          onClick={() => navigate(backTo)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Status banner */}
        {isClosed && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 mb-6">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <p className="text-sm text-yellow-400">This challenge is no longer accepting submissions.</p>
          </div>
        )}

        {/* Draft banner */}
        {isOwner && challenge.status === 'draft' && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-500/5 mb-6">
            <Pencil className="h-4 w-4 text-blue-400 shrink-0" />
            <p className="text-sm text-blue-400">
              This challenge is in draft — only you can see it. Use{' '}
              <span className="font-semibold">Manage Challenge</span> to publish it.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
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
              {challenge.submission_count} submission{challenge.submission_count !== 1 ? 's' : ''}
            </span>
            {/* TODO: link to /users/:id once public profile feature ships */}
            <span className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {creatorName}
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-border/30">
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              relative="path"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-secondary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}

          {/* Tab settings (owner only) */}
          {isOwner && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-auto h-9 w-9 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Show/hide tabs</p>
                  {OPTIONAL_TABS.map((tab) => (
                    <div key={tab.key} className="flex items-center gap-2">
                      <Checkbox
                        id={tab.key}
                        checked={(challenge.enabled_tabs ?? []).includes(tab.key)}
                        onCheckedChange={(checked) =>
                          handleTabToggle(tab.key, checked as boolean)
                        }
                      />
                      <label htmlFor={tab.key} className="text-sm cursor-pointer">
                        {tab.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Page content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Main content area with nested routes */}
          <div className="space-y-6">
            <Outlet
              context={{
                challenge,
                isOwner,
                onFieldSaved: (updated: Partial<Challenge>) => {
                  setChallenge((prev) => (prev ? { ...prev, ...updated } : prev));
                },
              }}
            />
          </div>

          {/* Sidebar */}
          <ChallengeMetaSidebar
            challenge={challenge}
            isOwner={isOwner}
            onToggleStatus={handleToggleStatus}
            onClose={handleClose}
            onNavigateEdit={() => navigate(`/dashboard/challenges/${challenge.id}/edit`)}
          />
        </div>
      </div>
    </div>
  );
};

export default ChallengeLayout;
