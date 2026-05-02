import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/moodverse/Header";
import { AuroraBackground } from "@/components/moodverse/AuroraBackground";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Brain, Loader2, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Entry = {
  id: string;
  input_text: string;
  emotions: string[] | null;
  intensity: number | null;
  created_at: string;
};

type Memory = {
  summary: string | null;
  recurring_themes: string[];
  dominant_emotions: string[];
  agent_notes: string | null;
  entries_analyzed: number;
  updated_at: string;
};

const Journey = () => {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insightBusy, setInsightBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ent }, { data: mem }] = await Promise.all([
        supabase.from("mood_entries").select("id, input_text, emotions, intensity, created_at").order("created_at", { ascending: true }),
        supabase.from("user_memory").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setEntries((ent ?? []) as any);
      if (mem) setMemory(mem as any);
      setBusy(false);
    })();
  }, [user]);

  const chartData = useMemo(() => {
    if (!entries.length) return [];
    const byDay = new Map<string, { sum: number; n: number }>();
    for (const e of entries) {
      if (e.intensity == null) continue;
      const d = new Date(e.created_at).toISOString().slice(0, 10);
      const cur = byDay.get(d) || { sum: 0, n: 0 };
      cur.sum += e.intensity; cur.n += 1;
      byDay.set(d, cur);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: date.slice(5),
        intensity: Number((v.sum / v.n).toFixed(1)),
      }));
  }, [entries]);

  const emotionCloud = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) for (const em of e.emotions || []) counts.set(em, (counts.get(em) || 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 18);
  }, [entries]);

  const refreshMemory = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("memory-agent", { body: {} });
      if (error) throw new Error((error as any)?.context?.error || error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.memory) { setMemory(data.memory); toast.success("Профиль обновлён"); }
      else toast.message(data?.message || "Недостаточно записей");
    } catch (e: any) {
      toast.error(e?.message || "Не удалось обновить");
    } finally { setRefreshing(false); }
  };

  const fetchInsight = async () => {
    setInsightBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("journey-insight", { body: {} });
      if (error) throw new Error((error as any)?.context?.error || error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.insight) setInsight(data.insight);
      else toast.message(data?.message || "Нужно больше записей");
    } catch (e: any) {
      toast.error(e?.message || "Не удалось получить инсайт");
    } finally { setInsightBusy(false); }
  };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const maxCount = emotionCloud[0]?.[1] || 1;

  return (
    <>
      <AuroraBackground />
      <Header />
      <main className="container max-w-4xl py-10">
        <header className="text-center mb-10 animate-fade-up">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground/80 mb-3">· Mood Journey ·</p>
          <h1 className="text-4xl sm:text-5xl italic font-serif mb-3 text-balance">Карта вашего пути</h1>
          <p className="text-muted-foreground italic font-serif max-w-md mx-auto">
            Ваши состояния, темы и тихие закономерности — собранные вместе.
          </p>
        </header>

        {busy && (
          <div className="text-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Загружаем...</div>
        )}

        {!busy && entries.length === 0 && (
          <div className="text-center py-20 text-muted-foreground italic font-serif">
            Сначала запишите первое состояние на главной — здесь появится ваша карта.
          </div>
        )}

        {!busy && entries.length > 0 && (
          <div className="space-y-8">
            {/* Memory profile */}
            <section className="rounded-3xl bg-card/50 backdrop-blur-md border border-border/60 p-6 shadow-card animate-fade-up">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h2 className="font-serif italic text-2xl">Эмоциональный профиль</h2>
                </div>
                <Button onClick={refreshMemory} disabled={refreshing} variant="outline" size="sm" className="rounded-full">
                  {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                  Обновить
                </Button>
              </div>
              {memory ? (
                <div className="space-y-4">
                  {memory.summary && <p className="font-serif italic text-foreground/85 leading-relaxed text-lg">{memory.summary}</p>}
                  {memory.recurring_themes?.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Возвращающиеся темы</p>
                      <div className="flex flex-wrap gap-2">
                        {memory.recurring_themes.map(t => (
                          <span key={t} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/70 italic">
                    Профиль построен на основе {memory.entries_analyzed} записей · {new Date(memory.updated_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic font-serif">
                  Профиль ещё не построен. Нажмите «Обновить» — агент памяти прочитает ваши записи и подберёт литературу глубже.
                </p>
              )}
            </section>

            {/* Intensity chart */}
            {chartData.length > 1 && (
              <section className="rounded-3xl bg-card/50 backdrop-blur-md border border-border/60 p-6 shadow-card animate-fade-up">
                <h2 className="font-serif italic text-2xl mb-4">Динамика интенсивности</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          fontFamily: "serif",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="intensity"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{ fill: "hsl(var(--primary))", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Emotion cloud */}
            {emotionCloud.length > 0 && (
              <section className="rounded-3xl bg-card/50 backdrop-blur-md border border-border/60 p-6 shadow-card animate-fade-up">
                <h2 className="font-serif italic text-2xl mb-4">Облако эмоций</h2>
                <div className="flex flex-wrap gap-3 items-baseline">
                  {emotionCloud.map(([word, count]) => {
                    const scale = 0.85 + (count / maxCount) * 1.2;
                    return (
                      <span
                        key={word}
                        className="font-serif italic text-foreground/80"
                        style={{ fontSize: `${scale}rem`, opacity: 0.5 + (count / maxCount) * 0.5 }}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* AI insight */}
            <section className="rounded-3xl bg-gradient-to-br from-primary/5 via-card/40 to-card/40 backdrop-blur-md border border-primary/30 p-6 shadow-card animate-fade-up">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-serif italic text-2xl">Поэтическое зеркало</h2>
              </div>
              {insight ? (
                <p className="font-serif italic text-foreground/85 leading-relaxed text-lg whitespace-pre-line">{insight}</p>
              ) : (
                <div>
                  <p className="text-muted-foreground italic font-serif mb-4">
                    Позвольте AI взглянуть на ваш путь со стороны и описать его одним абзацем.
                  </p>
                  <Button onClick={fetchInsight} disabled={insightBusy} variant="outline" className="rounded-full">
                    {insightBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                    Получить зеркало
                  </Button>
                </div>
              )}
            </section>

            <p className="text-center text-xs text-muted-foreground/60 italic font-serif pt-4">
              Всего {entries.length} {entries.length === 1 ? "запись" : entries.length < 5 ? "записи" : "записей"}
            </p>
          </div>
        )}
      </main>
    </>
  );
};

export default Journey;