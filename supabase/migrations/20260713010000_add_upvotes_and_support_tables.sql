-- Optional columns / tables the app expects. Safe to run multiple times.

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS ai_score INTEGER;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;

-- Sync priority_score into ai_score alias if empty
UPDATE public.reports
SET ai_score = COALESCE(ai_score, priority_score, 0)
WHERE ai_score IS NULL;

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

CREATE OR REPLACE FUNCTION public.increment_upvotes(issue_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reports
  SET upvotes = COALESCE(upvotes, 0) + 1
  WHERE id = issue_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_upvotes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_upvotes(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_upvotes(UUID) TO service_role;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'citizen',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
