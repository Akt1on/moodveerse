
-- ============ 1. ROLES ============
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin','user')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;

-- ============ 2. AI SPEND LOG ============
CREATE TABLE IF NOT EXISTS public.ai_spend_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  endpoint text NOT NULL,
  tokens_estimate bigint NOT NULL DEFAULT 0,
  cost_estimate numeric(12,6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_spend_log_day_idx ON public.ai_spend_log (day);
GRANT SELECT ON public.ai_spend_log TO authenticated;
GRANT ALL ON public.ai_spend_log TO service_role;
ALTER TABLE public.ai_spend_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read spend" ON public.ai_spend_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ 3. HARVEST QUEUE ============
CREATE TABLE IF NOT EXISTS public.harvest_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  cursor jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','error')),
  priority int NOT NULL DEFAULT 100,
  attempts int NOT NULL DEFAULT 0,
  inserted_count int NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS harvest_queue_pick_idx ON public.harvest_queue (status, priority DESC, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS harvest_queue_task_uq ON public.harvest_queue (source, md5(cursor::text));
GRANT SELECT ON public.harvest_queue TO authenticated;
GRANT ALL ON public.harvest_queue TO service_role;
ALTER TABLE public.harvest_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read queue" ON public.harvest_queue FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.claim_harvest_task()
RETURNS public.harvest_queue LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.harvest_queue;
BEGIN
  UPDATE public.harvest_queue q SET status='running', attempts = q.attempts + 1, updated_at = now()
  WHERE q.id = (
    SELECT id FROM public.harvest_queue
    WHERE status='pending' OR (status='running' AND updated_at < now() - interval '15 minutes')
    ORDER BY priority DESC, created_at
    LIMIT 1 FOR UPDATE SKIP LOCKED
  )
  RETURNING q.* INTO t;
  RETURN t;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_harvest_task() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_harvest_task() TO service_role;

-- ============ 4. CURATED AUTHORS ============
CREATE TABLE IF NOT EXISTS public.curated_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  language text NOT NULL DEFAULT 'ru',
  priority int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, language)
);
CREATE INDEX IF NOT EXISTS curated_authors_name_lower_idx ON public.curated_authors (lower(name));
GRANT SELECT ON public.curated_authors TO anon, authenticated;
GRANT ALL ON public.curated_authors TO service_role;
ALTER TABLE public.curated_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read curated authors" ON public.curated_authors FOR SELECT USING (true);

INSERT INTO public.curated_authors (name, language, priority) VALUES
('Александр Пушкин','ru',200),('Сергей Есенин','ru',190),('Анна Ахматова','ru',190),
('Марина Цветаева','ru',190),('Иосиф Бродский','ru',185),('Осип Мандельштам','ru',185),
('Николай Рубцов','ru',175),('Белла Ахмадулина','ru',175),('Борис Пастернак','ru',185),
('Александр Блок','ru',185),('Иван Бунин','ru',180),('Михаил Лермонтов','ru',185),
('Фёдор Тютчев','ru',175),('Афанасий Фет','ru',170),('Владимир Маяковский','ru',170),
('Григор Нарекаци','hy',200),('Ованес Туманян','hy',195),('Егише Чаренц','hy',195),
('Ваан Терьян','hy',190),('Паруйр Севак','hy',190),('Аветик Исаакян','hy',185),
('Сильва Капутикян','hy',185),('Уильям Сароян','hy',180),('Саят-Нова','hy',185),
('Рainер Мария Рильке','ru',180),
('Rainer Maria Rilke','en',180),('Pablo Neruda','en',180),('Emily Dickinson','en',185),
('Rumi','en',185),('Charles Baudelaire','en',180),('William Shakespeare','en',190),
('Walt Whitman','en',180),('Matsuo Basho','en',175),('W. B. Yeats','en',175),
('Robert Frost','en',175),('Sylvia Plath','en',170),('T. S. Eliot','en',175),
('Federico Garcia Lorca','en',175),('Khalil Gibran','en',175)
ON CONFLICT (name, language) DO NOTHING;

-- ============ 5. USER RESONANCE SIGNALS ============
CREATE TABLE IF NOT EXISTS public.user_resonance_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  embedding extensions.vector(1536),
  source_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_resonance_signals_user_idx ON public.user_resonance_signals (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.user_resonance_signals TO authenticated;
GRANT ALL ON public.user_resonance_signals TO service_role;
ALTER TABLE public.user_resonance_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own signals" ON public.user_resonance_signals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own signals" ON public.user_resonance_signals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own signals" ON public.user_resonance_signals FOR DELETE TO authenticated USING (auth.uid() = user_id);
