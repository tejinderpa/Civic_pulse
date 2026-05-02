-- ==========================================
-- CIVICPULSE MASTER SETUP SCRIPT
-- ==========================================

-- 1. REPORTS TABLE (The Core Data)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    location TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'pending',
    severity TEXT DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES (Privacy & Access)
-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Users can create their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can see their own reports" ON public.reports;
DROP POLICY IF EXISTS "Everyone can see all reports" ON public.reports;

CREATE POLICY "Users can create their own reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see their own reports" ON public.reports
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Everyone can see all reports" ON public.reports
FOR SELECT USING (true);

-- 3. STORAGE SETUP (Image Proofs)
-- Note: You might need to adjust based on your project's storage settings
-- If this fails, just create a bucket named 'civicpulse-assets' manually in Storage tab.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('civicpulse-assets', 'civicpulse-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Note: These policies assume the 'civicpulse-assets' bucket is used.
CREATE POLICY "Public Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'civicpulse-assets');
CREATE POLICY "Public Views" ON storage.objects FOR SELECT USING (bucket_id = 'civicpulse-assets');

-- ==========================================
-- FINISHED: Your Database is now Ready!
-- ==========================================
