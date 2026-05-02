-- ==========================================
-- CIVICPULSE MASTER SEED MIGRATION
-- ==========================================

-- 1. ALIGN REPORTS TABLE
ALTER TABLE public.reports 
RENAME COLUMN latitude TO lat;

ALTER TABLE public.reports 
RENAME COLUMN longitude TO lng;

ALTER TABLE public.reports 
RENAME COLUMN location TO address;

ALTER TABLE public.reports 
RENAME COLUMN priority_score TO ai_score;

ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS votes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES public.reports(id) ON DELETE SET NULL;

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category_slug TEXT, -- Mapping such as 'Road', 'Garbage'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Initial Departments
INSERT INTO public.departments (name, category_slug) VALUES 
('PWD (Roads)', 'Road'),
('Municipal Sanitation', 'Garbage'),
('Water & Sewerage Board', 'Water'),
('Electricity Department', 'Electricity'),
('Social Welfare', 'Other')
ON CONFLICT (name) DO NOTHING;

-- 3. ISSUE TIMELINE TABLE
CREATE TABLE IF NOT EXISTS public.issue_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'status_change', 'assignment', 'comment'
    old_value TEXT,
    new_value TEXT,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. VOTES TABLE
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, issue_id)
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT NOT NULL, -- 'new_issue', 'sla_breach', 'status_change', 'assignment'
    is_read BOOLEAN DEFAULT false,
    issue_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SLA CONFIGURATION
CREATE TABLE IF NOT EXISTS public.sla_config (
    severity TEXT PRIMARY KEY,
    hours INTEGER NOT NULL
);

INSERT INTO public.sla_config (severity, hours) VALUES 
('Critical', 24),
('High', 72),
('Medium', 168), -- 7 days
('Low', 336)     -- 14 days
ON CONFLICT (severity) DO NOTHING;

-- 7. ENABLE RLS ON NEW TABLES
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_config ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "Admins full access to departments" ON public.departments FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins full access to timeline" ON public.issue_timeline FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins full access to votes" ON public.votes FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins full access to notifications" ON public.notifications FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins full access to sla_config" ON public.sla_config FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Public and user specific policies
CREATE POLICY "Everyone can read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Users can see relevant timeline" ON public.issue_timeline FOR SELECT USING (true);
CREATE POLICY "Users can see notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can see votes" ON public.votes FOR SELECT USING (true);

-- ==========================================
-- FINISHED
-- ==========================================
