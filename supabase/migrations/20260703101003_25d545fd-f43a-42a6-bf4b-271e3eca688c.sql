CREATE INDEX IF NOT EXISTS mood_entries_user_created_idx ON public.mood_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS favorites_user_created_idx ON public.favorites (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS literary_works_language_idx ON public.literary_works (language);
CREATE INDEX IF NOT EXISTS literary_works_emotions_gin ON public.literary_works USING GIN (emotions_tags);