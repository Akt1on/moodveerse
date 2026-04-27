import { useState } from "react";
import { Header } from "@/components/moodverse/Header";
import { AuroraBackground } from "@/components/moodverse/AuroraBackground";
import { MoodForm, MoodInput } from "@/components/moodverse/MoodForm";
import { Loading } from "@/components/moodverse/Loading";
import { PieceCard, Piece } from "@/components/moodverse/PieceCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [lastInput, setLastInput] = useState<MoodInput | null>(null);

  const find = async (input: MoodInput) => {
    setLoading(true);
    setPieces(null);
    setLastInput(input);
    try {
      const { data, error } = await supabase.functions.invoke("find-resonance", { body: input });
      if (error) {
        const msg = (error as any)?.context?.error || error.message;
        toast.error(msg || "Не удалось получить отклик");
        setLoading(false);
        return;
      }
      if (data?.error) { toast.error(data.error); setLoading(false); return; }
      const list = (data?.pieces ?? []) as Piece[];
      setPieces(list);
      if (user && list.length) {
        await supabase.from("mood_entries").insert({
          user_id: user.id,
          input_text: input.input_text,
          emotions: input.emotions,
          intensity: input.intensity,
          context: input.context || null,
          results: list as any,
        });
      }
    } catch (e: any) {
      toast.error(e?.message || "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuroraBackground />
      <Header />
      <main className="container max-w-3xl py-10 sm:py-16">
        {!pieces && !loading && (
          <section className="text-center mb-10 animate-fade-up">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground/80 mb-4">· MoodVerse ·</p>
            <h1 className="text-4xl sm:text-6xl mb-4 italic text-balance leading-tight">
              Тишина,<br />что говорит
            </h1>
            <p className="text-muted-foreground font-serif italic text-lg max-w-md mx-auto text-balance">
              Опишите чувство — и поэзия откликнется именно так, как нужно сейчас.
            </p>
          </section>
        )}

        {loading && <Loading />}

        {!loading && !pieces && <MoodForm onSubmit={find} loading={loading} />}

        {pieces && !loading && (
          <section>
            <div className="flex items-center justify-between mb-6 animate-fade-up">
              <Button variant="ghost" size="sm" onClick={() => { setPieces(null); setLastInput(null); }} className="rounded-full">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Новый запрос
              </Button>
              <p className="text-xs text-muted-foreground italic">Найдено {pieces.length} откликов</p>
            </div>
            {lastInput && (
              <blockquote className="mb-8 px-5 py-4 rounded-2xl bg-card/40 backdrop-blur-sm border-l-2 border-primary/60 italic font-serif text-foreground/70 animate-fade-up">
                «{lastInput.input_text}»
              </blockquote>
            )}
            <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
              {pieces.map((p, i) => <PieceCard key={i} piece={p} index={i} />)}
            </div>
            {!user && (
              <div className="mt-10 p-6 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/60 text-center animate-fade-up">
                <p className="font-serif italic text-foreground/80">
                  Войдите, чтобы сохранять отзывы и видеть журнал своих состояний
                </p>
              </div>
            )}
          </section>
        )}
      </main>
      <footer className="container max-w-6xl pb-10 pt-4 text-center text-xs text-muted-foreground/60">
        <p className="font-serif italic">Слова, которые помнят то, что мы забыли о себе</p>
      </footer>
    </>
  );
};

export default Index;
