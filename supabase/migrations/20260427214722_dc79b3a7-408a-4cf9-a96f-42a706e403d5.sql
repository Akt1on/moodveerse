-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base table
CREATE TABLE public.literary_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  title TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('poem','book','film','monologue','quote')),
  emotions_tags TEXT[] NOT NULL DEFAULT '{}',
  theme TEXT,
  mood_intensity INTEGER,
  language TEXT NOT NULL DEFAULT 'ru',
  year INTEGER,
  embedding vector(1536),
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX literary_works_external_uq ON public.literary_works(source_type, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX literary_works_lang_idx ON public.literary_works(language);
CREATE INDEX literary_works_source_idx ON public.literary_works(source_type);
CREATE INDEX literary_works_emotions_idx ON public.literary_works USING GIN(emotions_tags);
CREATE INDEX literary_works_embedding_idx ON public.literary_works USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.literary_works ENABLE ROW LEVEL SECURITY;

-- Knowledge base is shared and publicly readable
CREATE POLICY "Anyone can read literary works"
ON public.literary_works
FOR SELECT
USING (true);

-- No client writes — only service role (which bypasses RLS) via edge functions

-- Semantic search RPC
CREATE OR REPLACE FUNCTION public.match_literary_works(
  query_embedding vector(1536),
  match_count INT DEFAULT 20,
  filter_language TEXT DEFAULT NULL,
  filter_emotions TEXT[] DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  author TEXT,
  title TEXT,
  source_type TEXT,
  emotions_tags TEXT[],
  language TEXT,
  year INTEGER,
  similarity FLOAT
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    lw.id, lw.text, lw.author, lw.title, lw.source_type,
    lw.emotions_tags, lw.language, lw.year,
    1 - (lw.embedding <=> query_embedding) AS similarity
  FROM public.literary_works lw
  WHERE lw.embedding IS NOT NULL
    AND (filter_language IS NULL OR lw.language = filter_language)
    AND (filter_emotions IS NULL OR lw.emotions_tags && filter_emotions)
    AND 1 - (lw.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY lw.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;