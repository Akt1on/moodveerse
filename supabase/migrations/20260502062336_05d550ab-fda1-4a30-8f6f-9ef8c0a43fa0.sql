CREATE TABLE public.user_memory (
  user_id UUID NOT NULL PRIMARY KEY,
  summary TEXT,
  recurring_themes TEXT[] NOT NULL DEFAULT '{}',
  dominant_emotions TEXT[] NOT NULL DEFAULT '{}',
  agent_notes TEXT,
  entries_analyzed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own memory"
ON public.user_memory FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own memory"
ON public.user_memory FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own memory"
ON public.user_memory FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own memory"
ON public.user_memory FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mood_entries_user_created ON public.mood_entries(user_id, created_at DESC);