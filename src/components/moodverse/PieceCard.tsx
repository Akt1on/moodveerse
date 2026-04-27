import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Volume2, Copy, Check, ChevronDown, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Piece = {
  title: string;
  author: string;
  year?: string;
  source_type: "poem" | "book" | "film" | "quote";
  text: string;
  explanation: string;
  relevance_score: number;
  is_original?: boolean;
};

const typeLabel: Record<Piece["source_type"], string> = {
  poem: "Стихотворение", book: "Книга", film: "Фильм", quote: "Цитата",
};

export const PieceCard = ({ piece, index }: { piece: Piece; index: number }) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const lines = piece.text.split("\n");
  const long = lines.length > 12 || piece.text.length > 600;
  const preview = long && !expanded ? lines.slice(0, 10).join("\n") : piece.text;

  const copy = async () => {
    await navigator.clipboard.writeText(`${piece.text}\n\n— ${piece.author}${piece.title ? `, «${piece.title}»` : ""}`);
    setCopied(true);
    toast.success("Скопировано");
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    const data = { title: `${piece.author} — ${piece.title}`, text: piece.text };
    try {
      if (navigator.share) await navigator.share(data);
      else { await copy(); toast.info("Готово к отправке"); }
    } catch {}
  };

  const speak = () => {
    if (!("speechSynthesis" in window)) { toast.error("Озвучка не поддерживается"); return; }
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(piece.text);
    u.lang = "ru-RU"; u.rate = 0.85; u.pitch = 1;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const save = async () => {
    if (!user) { toast.info("Войдите, чтобы сохранять в Избранное"); return; }
    if (saved) return;
    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      text: piece.text,
      author: piece.author,
      title: piece.title,
      source_type: piece.source_type,
      explanation: piece.explanation,
    });
    if (error) toast.error("Не удалось сохранить");
    else { setSaved(true); toast.success("В Избранном"); }
  };

  return (
    <article
      className="group relative rounded-3xl bg-gradient-card backdrop-blur-md border border-border/60 p-6 sm:p-8 shadow-card hover:shadow-soft transition-soft animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-accent/60 text-accent-foreground tracking-wide">{typeLabel[piece.source_type]}</span>
          {piece.is_original && (
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary tracking-wide">В духе автора</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-primary/80">
          <Star className="h-3 w-3 fill-primary/40 stroke-primary" />
          <span className="font-medium">{piece.relevance_score}%</span>
        </div>
      </div>

      <pre className="whitespace-pre-wrap font-serif text-[1.05rem] sm:text-lg leading-relaxed text-foreground/90 italic">{preview}</pre>

      {long && (
        <button onClick={() => setExpanded(v => !v)}
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          {expanded ? "Свернуть" : "Читать полностью"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}

      <div className="mt-5 pt-4 border-t border-border/50">
        <p className="font-serif text-sm text-muted-foreground">
          — <span className="text-foreground/80">{piece.author}</span>
          {piece.title && <>, <em>«{piece.title}»</em></>}
          {piece.year && <span className="text-muted-foreground/60"> · {piece.year}</span>}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground italic font-serif">
          {piece.explanation}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        <Button size="sm" variant="ghost" onClick={save} className="rounded-full text-xs h-8">
          <Heart className={`h-3.5 w-3.5 mr-1.5 ${saved ? "fill-destructive stroke-destructive" : ""}`} />
          {saved ? "Сохранено" : "В избранное"}
        </Button>
        <Button size="sm" variant="ghost" onClick={speak} className="rounded-full text-xs h-8">
          <Volume2 className={`h-3.5 w-3.5 mr-1.5 ${speaking ? "text-primary" : ""}`} />
          {speaking ? "Стоп" : "Озвучить"}
        </Button>
        <Button size="sm" variant="ghost" onClick={share} className="rounded-full text-xs h-8">
          <Share2 className="h-3.5 w-3.5 mr-1.5" />Поделиться
        </Button>
        <Button size="sm" variant="ghost" onClick={copy} className="rounded-full text-xs h-8">
          {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
          Копировать
        </Button>
      </div>
    </article>
  );
};
