import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sun, Sunrise, Sunset, Moon, Sparkles } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

type Part = "morning" | "day" | "evening" | "night";

type DailyPiece = {
  text: string;
  author: string;
  title: string | null;
  source_type: string;
  year: number | null;
};

type DailyResponse = {
  date: string;
  part: Part;
  intro: string;
  piece: DailyPiece;
};

const ICONS: Record<Part, JSX.Element> = {
  morning: <Sunrise className="h-3.5 w-3.5" />,
  day:     <Sun className="h-3.5 w-3.5" />,
  evening: <Sunset className="h-3.5 w-3.5" />,
  night:   <Moon className="h-3.5 w-3.5" />,
};

const CACHE_KEY = "moodverse_daily_v2";

export const DailyVerse = () => {
  const { locale } = useLocale();
  const [data, setData] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tz = -new Date().getTimezoneOffset(); // minutes east of UTC
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `${CACHE_KEY}_${locale}`;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { date: string; part: Part; payload: DailyResponse };
        if (parsed.date === today) {
          // Cache by date+part to refresh between morning/day/evening/night.
          const hr = new Date().getHours();
          const part: Part =
            hr >= 5 && hr < 12 ? "morning" :
            hr >= 12 && hr < 17 ? "day" :
            hr >= 17 && hr < 22 ? "evening" : "night";
          if (parsed.part === part) {
            setData(parsed.payload);
            setLoading(false);
            return;
          }
        }
      }
    } catch {}

    setLoading(true);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-verse?lang=${locale}&tz=${tz}`;
    fetch(url, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    })
      .then((r) => r.json())
      .then((payload: DailyResponse) => {
        if (payload && payload.piece) {
          setData(payload);
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({ date: payload.date, part: payload.part, payload }),
            );
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale]);

  if (loading) {
    return (
      <div className="mb-10 animate-pulse rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-6 h-32" />
    );
  }
  if (!data?.piece) return null;

  const { piece, part, intro } = data;
  const lines = piece.text.split("\n").slice(0, 6);

  return (
    <section className="mb-10 animate-fade-up">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-md p-6 sm:p-7 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {ICONS[part]}
          <span>{intro}</span>
          <Sparkles className="h-3 w-3 ml-auto text-primary/70" />
        </div>
        <blockquote className="font-serif italic text-foreground/90 text-lg leading-relaxed whitespace-pre-line">
          {lines.join("\n")}
        </blockquote>
        <p className="mt-4 text-xs text-muted-foreground">
          — {piece.author}
          {piece.title ? `, «${piece.title}»` : ""}
          {piece.year ? `, ${piece.year}` : ""}
        </p>
      </div>
    </section>
  );
};