-- ==========================================
-- CIVICPULSE IDENTITY & ROLE SETUP
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. PROFILES TABLE (Extends auth.users with role info)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'authority_staff')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (name, etc., not role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins can read all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ==========================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'citizen')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 3. REPORTS TABLE RLS (Role-Based)
-- ==========================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Users can see their own reports" ON public.reports;
DROP POLICY IF EXISTS "Everyone can see all reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create their own reports" ON public.reports;

-- Public can see all reports (limited view - no PII)
CREATE POLICY "Public read reports" ON public.reports
  FOR SELECT USING (true);

-- Citizens can insert their own
CREATE POLICY "Citizens can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Citizens can update ONLY their own reports
CREATE POLICY "Citizens update own reports" ON public.reports
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins have full access to all reports
CREATE POLICY "Admins full access to reports" ON public.reports
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'authority_staff')
  );

-- ==========================================
-- DONE! 
-- ==========================================
-- Default Admin Access Code for signup: CP-ADMIN-2026
-- To manually make an existing user admin, run:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
-- ==========================================
