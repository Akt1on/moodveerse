CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.literary_works ADD COLUMN IF NOT EXISTS search_doc text;
ALTER TABLE public.literary_works ADD COLUMN IF NOT EXISTS search_tsv tsvector;

CREATE OR REPLACE FUNCTION public.literary_works_refresh_search()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_doc := coalesce(NEW.text,'') || ' ' || coalesce(NEW.title,'') || ' ' || coalesce(NEW.author,'') || ' ' || coalesce(array_to_string(NEW.emotions_tags, ' '), '');
  NEW.search_tsv := to_tsvector('simple', NEW.search_doc);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS literary_works_search_refresh ON public.literary_works;
CREATE TRIGGER literary_works_search_refresh
BEFORE INSERT OR UPDATE ON public.literary_works
FOR EACH ROW EXECUTE FUNCTION public.literary_works_refresh_search();

UPDATE public.literary_works SET text = text;

CREATE INDEX IF NOT EXISTS literary_works_search_tsv_idx ON public.literary_works USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS literary_works_search_trgm_idx ON public.literary_works USING GIN (search_doc gin_trgm_ops);
CREATE INDEX IF NOT EXISTS literary_works_emotions_idx ON public.literary_works USING GIN (emotions_tags);
CREATE INDEX IF NOT EXISTS literary_works_language_idx ON public.literary_works (language);

CREATE OR REPLACE FUNCTION public.match_literary_lexical(
  query_text text,
  query_emotions text[] DEFAULT NULL,
  preferred_language text DEFAULT NULL,
  match_count integer DEFAULT 24
)
RETURNS TABLE (
  id uuid, text text, author text, title text, source_type text,
  emotions_tags text[], language text, year integer, score double precision
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    lw.id, lw.text, lw.author, lw.title, lw.source_type,
    lw.emotions_tags, lw.language, lw.year,
    (
      similarity(coalesce(lw.search_doc,''), coalesce(query_text, '')) * 1.0
      + CASE WHEN query_emotions IS NOT NULL AND lw.emotions_tags && query_emotions
             THEN 0.5 * cardinality(ARRAY(SELECT unnest(lw.emotions_tags) INTERSECT SELECT unnest(query_emotions))) ELSE 0 END
      + CASE WHEN preferred_language IS NOT NULL AND lw.language = preferred_language THEN 0.3 ELSE 0 END
    )::double precision AS score
  FROM public.literary_works lw
  WHERE
    (query_text IS NOT NULL AND (lw.search_doc % query_text OR lw.search_tsv @@ plainto_tsquery('simple', query_text)))
    OR (query_emotions IS NOT NULL AND lw.emotions_tags && query_emotions)
  ORDER BY score DESC NULLS LAST
  LIMIT match_count;
$$;