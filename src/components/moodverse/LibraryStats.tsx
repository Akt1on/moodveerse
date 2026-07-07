import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Loader2 } from "lucide-react";

type Stats = {
  total: number;
  embedded: number;
  authors: number;
  by_language: Record<string, number>;
  by_source_type: Record<string, number>;
  top_emotions: { tag: string; count: number }[];
  last_added: string | null;
};

const LANG_LABEL: Record<string, string> = {
  ru: "русский", en: "английский", hy: "армянский",
  fr: "французский", de: "немецкий", es: "испанский",
};
const TYPE_LABEL: Record<string, string> = {
  poem: "стихи", book: "проза", quote: "цитаты",
  film: "кино", monologue: "монологи",
};

export function LibraryStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("library_stats");
      if (error || !data) { setErr(true); return; }
      setStats(data as unknown as Stats);
    })();
  }, []);

  if (err) return null;
  if (!stats) {
    return (
      <section className="rounded-3xl bg-card/40 backdrop-blur-md border border-border/60 p-6 shadow-card">
        <div className="flex items-center gap-2 text-muted-foreground text-sm italic font-serif">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Библиотека загружается…
        </div>
      </section>
    );
  }

  const langs = Object.entries(stats.by_language).sort((a, b) => b[1] - a[1]);
  const types = Object.entries(stats.by_source_type).sort((a, b) => b[1] - a[1]);
  const embeddedPct = stats.total ? Math.round((stats.embedded / stats.total) * 100) : 0;

  return (
    <section className="rounded-3xl bg-card/50 backdrop-blur-md border border-border/60 p-6 shadow-card animate-fade-up">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="font-serif italic text-2xl">Живая библиотека</h2>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl bg-background/40 border border-border/40 p-3 text-center">
          <div className="font-serif italic text-3xl text-primary">{stats.total.toLocaleString("ru")}</div>
          <div className="text-xs text-muted-foreground mt-1">произведений</div>
        </div>
        <div className="rounded-2xl bg-background/40 border border-border/40 p-3 text-center">
          <div className="font-serif italic text-3xl text-primary">{stats.authors.toLocaleString("ru")}</div>
          <div className="text-xs text-muted-foreground mt-1">авторов</div>
        </div>
        <div className="rounded-2xl bg-background/40 border border-border/40 p-3 text-center">
          <div className="font-serif italic text-3xl text-primary">{embeddedPct}%</div>
          <div className="text-xs text-muted-foreground mt-1">с эмбеддингами</div>
        </div>
      </div>

      {langs.length > 0 && (
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Языки</div>
          <div className="flex flex-wrap gap-1.5">
            {langs.map(([code, n]) => (
              <span key={code} className="text-xs rounded-full bg-primary/10 text-foreground/80 px-3 py-1 border border-primary/20">
                {LANG_LABEL[code] ?? code} · {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {types.length > 0 && (
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Форматы</div>
          <div className="flex flex-wrap gap-1.5">
            {types.map(([code, n]) => (
              <span key={code} className="text-xs rounded-full bg-background/50 text-foreground/70 px-3 py-1 border border-border/40">
                {TYPE_LABEL[code] ?? code} · {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {stats.top_emotions?.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Топ эмоций</div>
          <div className="flex flex-wrap gap-1.5">
            {stats.top_emotions.slice(0, 10).map((e) => (
              <span key={e.tag} className="text-xs rounded-full bg-primary/5 text-foreground/75 px-3 py-1 border border-primary/15 italic font-serif">
                {e.tag} · {e.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {stats.last_added && (
        <p className="text-xs text-muted-foreground/60 italic font-serif mt-4">
          Последнее пополнение: {new Date(stats.last_added).toLocaleDateString("ru")}
        </p>
      )}
    </section>
  );
}