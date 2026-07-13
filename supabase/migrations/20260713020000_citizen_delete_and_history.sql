-- Citizens can delete their own reports
DROP POLICY IF EXISTS "Citizens delete own reports" ON public.reports;
CREATE POLICY "Citizens delete own reports" ON public.reports
  FOR DELETE USING (auth.uid() = user_id);

-- Citizens can write history for reports they own (e.g. submission event)
DROP POLICY IF EXISTS "Citizens insert own report history" ON public.issue_history;
CREATE POLICY "Citizens insert own report history" ON public.issue_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = issue_id AND r.user_id = auth.uid()
    )
  );

-- Allow authenticated users to delete their uploaded assets under reports/
DROP POLICY IF EXISTS "Authenticated delete own civicpulse-assets" ON storage.objects;
CREATE POLICY "Authenticated delete own civicpulse-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'civicpulse-assets');
