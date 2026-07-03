import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/moodverse/Header";
import { AuroraBackground } from "@/components/moodverse/AuroraBackground";
import { PieceCard, Piece } from "@/components/moodverse/PieceCard";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type Entry = {
  id: string;
  input_text: string;
  emotions: string[] | null;
  intensity: number | null;
  context: string | null;
  results: Piece[] | null;
  created_at: string;
};

const PAGE_SIZE = 20;

const Journal = () => {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(async (from: number) => {
    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) { toast.error("Не удалось загрузить журнал"); return []; }
    const rows = (data ?? []) as any as Entry[];
    setHasMore(rows.length === PAGE_SIZE);
    return rows;
  }, []);

  useEffect(() => {
    if (!user) return;
    setBusy(true);
    loadPage(0).then((rows) => { setEntries(rows); setBusy(false); });
  }, [user, loadPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    const rows = await loadPage(entries.length);
    setEntries((prev) => [...prev, ...rows]);
    setLoadingMore(false);
  };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const remove = async (id: string) => {
    const { error } = await supabase.from("mood_entries").delete().eq("id", id);
    if (error) toast.error("Не удалось удалить");
    else { setEntries(p => p.filter(e => e.id !== id)); toast.success("Удалено"); }
  };

  return (
    <>
      <AuroraBackground />
      <Header />
      <main className="container max-w-4xl py-10">
        <h1 className="text-4xl italic font-serif text-center mb-2">Журнал состояний</h1>
        <p className="text-center text-muted-foreground italic font-serif mb-10">Память твоих внутренних погод</p>

        {busy && <p className="text-center text-muted-foreground">Загружаем...</p>}
        {!busy && entries.length === 0 && (
          <div className="text-center py-20 text-muted-foreground italic font-serif">Журнал пока пуст</div>
        )}

        <div className="space-y-4">
          {entries.map(e => {
            const date = new Date(e.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
            const isOpen = open === e.id;
            return (
              <div key={e.id} className="rounded-2xl bg-gradient-card backdrop-blur-md border border-border/60 shadow-card overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : e.id)} className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-secondary/30 transition-soft">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{date}</p>
                    <p className="font-serif italic text-foreground/90 line-clamp-2">«{e.input_text}»</p>
                    {e.emotions && e.emotions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {e.emotions.slice(0, 5).map(em => (
                          <span key={em} className="px-2 py-0.5 rounded-full bg-secondary/60 text-xs">{em}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={(ev) => { ev.stopPropagation(); remove(e.id); }}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {isOpen && e.results && (
                  <div className="px-5 pb-5 grid gap-4 lg:grid-cols-2">
                    {e.results.map((p, i) => <PieceCard key={i} piece={p} index={i} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!busy && hasMore && entries.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button variant="ghost" onClick={loadMore} disabled={loadingMore} className="rounded-full">
              {loadingMore ? "Загружаем..." : "Показать ещё"}
            </Button>
          </div>
        )}
      </main>
    </>
  );
};

export default Journal;
