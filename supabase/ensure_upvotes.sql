-- Run in Supabase SQL Editor if upvotes / one-vote-per-user is broken

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, issue_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read votes" ON public.votes;
CREATE POLICY "Anyone can read votes" ON public.votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own votes" ON public.votes;
CREATE POLICY "Users can insert own votes" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sync counter from votes table (optional repair)
UPDATE public.reports r
SET upvotes = sub.cnt
FROM (
  SELECT issue_id, COUNT(*)::int AS cnt
  FROM public.votes
  GROUP BY issue_id
) sub
WHERE r.id = sub.issue_id;
