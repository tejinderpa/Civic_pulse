-- CivicPulse: unify reports model, votes RLS, history table, admin helpers
-- Safe to run multiple times (IF EXISTS / ON CONFLICT patterns).

-- 1) Ensure reports has canonical columns
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS ai_score INTEGER;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS duplicate_of UUID;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS task_force_id UUID;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'Medium';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Migrate legacy column names if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'lat'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'latitude'
  ) THEN
    UPDATE public.reports SET latitude = COALESCE(latitude, lat) WHERE latitude IS NULL AND lat IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'lng'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'longitude'
  ) THEN
    UPDATE public.reports SET longitude = COALESCE(longitude, lng) WHERE longitude IS NULL AND lng IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'address'
  ) THEN
    UPDATE public.reports SET location = COALESCE(location, address) WHERE location IS NULL AND address IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'votes_count'
  ) THEN
    UPDATE public.reports SET upvotes = COALESCE(upvotes, votes_count, 0);
  END IF;
END $$;

-- Normalize status values
UPDATE public.reports SET status = 'Submitted'
  WHERE lower(coalesce(status, '')) IN ('pending', 'submitted', '');
UPDATE public.reports SET status = 'Under Review'
  WHERE lower(coalesce(status, '')) IN ('under review', 'review');
UPDATE public.reports SET status = 'In Progress'
  WHERE lower(coalesce(status, '')) IN ('in progress', 'in_progress', 'progress');
UPDATE public.reports SET status = 'Resolved'
  WHERE lower(coalesce(status, '')) IN ('resolved', 'closed', 'done');
UPDATE public.reports SET status = 'Rejected'
  WHERE lower(coalesce(status, '')) IN ('rejected', 'denied');

ALTER TABLE public.reports ALTER COLUMN status SET DEFAULT 'Submitted';

-- 2) Votes table
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

DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;
CREATE POLICY "Users can delete own votes" ON public.votes
  FOR DELETE USING (auth.uid() = user_id);

-- 3) Atomic upvote increment on reports
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
GRANT EXECUTE ON FUNCTION public.increment_upvotes(UUID) TO service_role;

-- 4) Issue history (canonical timeline table)
CREATE TABLE IF NOT EXISTS public.issue_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  user_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.issue_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read issue history" ON public.issue_history;
CREATE POLICY "Anyone can read issue history" ON public.issue_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert issue history" ON public.issue_history;
CREATE POLICY "Admins can insert issue history" ON public.issue_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'authority_staff')
    )
  );

-- Copy from issue_timeline if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'issue_timeline'
  ) THEN
    INSERT INTO public.issue_history (issue_id, action_type, old_value, new_value, user_name, created_at)
    SELECT issue_id, action_type, old_value, new_value, user_name, created_at
    FROM public.issue_timeline
    ON CONFLICT DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'issue_timeline copy skipped: %', SQLERRM;
END $$;

-- 5) Notifications mark-read for owner
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
    CREATE POLICY "Users read own notifications" ON public.notifications
      FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
    CREATE POLICY "Users update own notifications" ON public.notifications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6) Storage: prefer authenticated uploads (drop wide-open public insert if present)
DROP POLICY IF EXISTS "Public Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated uploads to civicpulse-assets" ON storage.objects;
CREATE POLICY "Authenticated uploads to civicpulse-assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'civicpulse-assets');

DROP POLICY IF EXISTS "Public Views" ON storage.objects;
DROP POLICY IF EXISTS "Public read civicpulse-assets" ON storage.objects;
CREATE POLICY "Public read civicpulse-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'civicpulse-assets');

-- 7) Helper: is_admin for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'authority_staff')
  );
$$;

-- Admin full access on reports
DROP POLICY IF EXISTS "Admins full access reports" ON public.reports;
CREATE POLICY "Admins full access reports" ON public.reports
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
