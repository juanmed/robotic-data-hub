-- Add enabled_tabs column to challenges table
-- Stores which optional tabs the owner has enabled for this challenge
-- 'overview' and 'submissions' are always shown and are NOT stored here
-- Allowed values: 'rules', 'discussion', 'leaderboard'
-- Default: empty array means only mandatory tabs are shown

ALTER TABLE public.challenges
  ADD COLUMN enabled_tabs text[] NOT NULL DEFAULT '{}';

-- No new RLS policies needed — existing challenges_owner_crud covers UPDATE,
-- existing challenges_public_read_active covers SELECT
