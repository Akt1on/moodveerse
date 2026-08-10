CREATE OR REPLACE FUNCTION public.match_literary_works(
  query_embedding extensions.vector,
  match_count integer DEFAULT 20,
  filter_language text DEFAULT NULL,
  filter_emotions text[] DEFAULT NULL,
  similarity_threshold double precision DEFAULT 0.18
)
RETURNS TABLE(
  id uuid,
  text text,
  author text,
  title text,
  source_type text,
  emotions_tags text[],
  language text,
  year integer,
  similarity double precision
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  WITH nearest AS (
    SELECT
      lw.id, lw.text, lw.author, lw.title, lw.source_type,
      lw.emotions_tags, lw.language, lw.year,
      1 - (lw.embedding OPERATOR(extensions.<=>) query_embedding) AS semantic_similarity
    FROM public.literary_works lw
    WHERE lw.embedding IS NOT NULL
      AND (filter_language IS NULL OR lw.language = filter_language)
    ORDER BY lw.embedding OPERATOR(extensions.<=>) query_embedding
    LIMIT GREATEST(match_count * 4, 60)
  )
  SELECT
    n.id, n.text, n.author, n.title, n.source_type,
    n.emotions_tags, n.language, n.year,
    (
      n.semantic_similarity
      + CASE
          WHEN filter_emotions IS NOT NULL AND n.emotions_tags && filter_emotions
          THEN LEAST(0.06, 0.02 * cardinality(ARRAY(
            SELECT unnest(n.emotions_tags)
            INTERSECT
            SELECT unnest(filter_emotions)
          )))
          ELSE 0
        END
    )::double precision AS similarity
  FROM nearest n
  WHERE n.semantic_similarity >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_literary_lexical(
  query_text text,
  query_emotions text[] DEFAULT NULL,
  preferred_language text DEFAULT NULL,
  match_count integer DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  text text,
  author text,
  title text,
  source_type text,
  emotions_tags text[],
  language text,
  year integer,
  score double precision
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  WITH scored AS (
    SELECT
      lw.id, lw.text, lw.author, lw.title, lw.source_type,
      lw.emotions_tags, lw.language, lw.year,
      ts_rank_cd(lw.search_tsv, plainto_tsquery('simple', coalesce(query_text, ''))) AS fts_rank,
      public.word_similarity(coalesce(query_text, ''), coalesce(lw.search_doc, '')) AS word_score,
      CASE
        WHEN query_emotions IS NOT NULL AND lw.emotions_tags && query_emotions
        THEN LEAST(0.12, 0.04 * cardinality(ARRAY(
          SELECT unnest(lw.emotions_tags)
          INTERSECT
          SELECT unnest(query_emotions)
        )))
        ELSE 0
      END AS emotion_bonus
    FROM public.literary_works lw
    WHERE (preferred_language IS NULL OR lw.language = preferred_language)
      AND query_text IS NOT NULL
      AND length(btrim(query_text)) >= 3
      AND (
        lw.search_tsv @@ plainto_tsquery('simple', query_text)
        OR public.word_similarity(query_text, coalesce(lw.search_doc, '')) >= 0.12
      )
  )
  SELECT
    s.id, s.text, s.author, s.title, s.source_type,
    s.emotions_tags, s.language, s.year,
    (LEAST(1.0, s.fts_rank * 1.8) + s.word_score * 0.7 + s.emotion_bonus)::double precision AS score
  FROM scored s
  ORDER BY score DESC
  LIMIT match_count;
$$;