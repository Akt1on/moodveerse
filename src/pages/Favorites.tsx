import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/moodverse/Header";
import { AuroraBackground } from "@/components/moodverse/AuroraBackground";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Search } from "lucide-react";
import { toast } from "sonner";

type Fav = {
  id: string; text: string; author: string | null; title: string | null;
  source_type: string | null; explanation: string | null; created_at: string;
};

const Favorites = () => {
  const { user, loading } = useAuth();
  const [favs, setFavs] = useState<Fav[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("favorites").select("*").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error("Не удалось загрузить");
        else setFavs((data ?? []) as any);
        setBusy(false);
      });
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const remove = async (id: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", id);
    if (error) toast.error("Не удалось удалить");
    else { setFavs(p => p.filter(f => f.id !== id)); }
  };

  const types = ["all", "poem", "book", "film", "quote"];
  const labels: Record<string, string> = { all: "Все", poem: "Стихи", book: "Книги", film: "Фильмы", quote: "Цитаты" };

  const visible = favs.filter(f => {
    if (filter !== "all" && f.source_type !== filter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return f.text.toLowerCase().includes(s) || (f.author?.toLowerCase().includes(s)) || (f.title?.toLowerCase().includes(s));
  });

  return (
    <>
      <AuroraBackground />
      <Header />
      <main className="container max-w-4xl py-10">
        <h1 className="text-4xl italic font-serif text-center mb-2">Избранное</h1>
        <p className="text-center text-muted-foreground italic font-serif mb-8">Слова, что остались с тобой</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по строкам, автору, названию..." className="pl-10 rounded-full" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {types.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-soft ${
                  filter === t ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:border-primary/50"
                }`}>{labels[t]}</button>
            ))}
          </div>
        </div>

        {busy && <p className="text-center text-muted-foreground">Загружаем...</p>}
        {!busy && visible.length === 0 && (
          <div className="text-center py-20 text-muted-foreground italic font-serif">Ничего не найдено</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map(f => (
            <article key={f.id} className="rounded-2xl bg-gradient-card backdrop-blur-md border border-border/60 p-6 shadow-card animate-fade-up">
              <pre className="whitespace-pre-wrap font-serif italic text-foreground/90 text-base leading-relaxed line-clamp-[10]">{f.text}</pre>
              <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-end gap-3">
                <p className="font-serif text-sm text-muted-foreground">
                  — <span className="text-foreground/80">{f.author}</span>
                  {f.title && <>, <em>«{f.title}»</em></>}
                </p>
                <Button size="icon" variant="ghost" onClick={() => remove(f.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
};

export default Favorites;
