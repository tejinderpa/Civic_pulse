-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding and duplicate_of columns to reports table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='embedding') THEN
        ALTER TABLE public.reports ADD COLUMN embedding vector(768);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='duplicate_of') THEN
        ALTER TABLE public.reports ADD COLUMN duplicate_of UUID REFERENCES public.reports(id);
    END IF;
END $$;

-- 3. Create index for faster semantic search metrics
DROP INDEX IF EXISTS reports_embedding_idx;
CREATE INDEX reports_embedding_idx ON public.reports USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Create RPC for Geo-filtering and retrieving embeddings
CREATE OR REPLACE FUNCTION find_nearby_reports(
  target_lat FLOAT,
  target_lng FLOAT,
  target_category TEXT,
  radius_meters INT DEFAULT 500
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  lat FLOAT,
  lng FLOAT,
  embedding vector(768),
  distance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description,
    r.location,
    r.latitude AS lat,
    r.longitude AS lng,
    r.embedding,
    ST_Distance(
      ST_MakePoint(r.longitude, r.latitude)::geography,
      ST_MakePoint(target_lng, target_lat)::geography
    ) AS distance
  FROM public.reports r
  WHERE r.status != 'Resolved'
    AND (target_category IS NULL OR r.category = target_category)
    AND r.latitude IS NOT NULL 
    AND r.longitude IS NOT NULL
    AND ST_DWithin(
      ST_MakePoint(r.longitude, r.latitude)::geography,
      ST_MakePoint(target_lng, target_lat)::geography,
      radius_meters
    )
  ORDER BY distance
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
