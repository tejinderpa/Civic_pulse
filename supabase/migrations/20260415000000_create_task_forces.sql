-- Create task_forces table
CREATE TABLE IF NOT EXISTS public.task_forces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disbanded')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create task_force_issues junction table
CREATE TABLE IF NOT EXISTS public.task_force_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_force_id UUID REFERENCES public.task_forces(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(task_force_id, issue_id)
);

-- Add task_force_id to reports (issues) table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='task_force_id') THEN
        ALTER TABLE public.reports ADD COLUMN task_force_id UUID REFERENCES public.task_forces(id);
    END IF;
END $$;

-- Create issue_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.issue_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    user_name TEXT, -- Simplified for the demo as seen in types
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_forces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_force_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_history ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Admins can view task forces" ON public.task_forces FOR SELECT USING (true);
CREATE POLICY "Admins can view task force issues" ON public.task_force_issues FOR SELECT USING (true);
CREATE POLICY "Everyone can view history" ON public.issue_history FOR SELECT USING (true);
