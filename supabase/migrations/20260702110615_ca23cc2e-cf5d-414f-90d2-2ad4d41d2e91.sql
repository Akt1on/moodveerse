DROP INDEX IF EXISTS public.literary_works_embedding_idx;
CREATE INDEX literary_works_embedding_hnsw_idx
  ON public.literary_works
  USING hnsw (embedding extensions.vector_cosine_ops);