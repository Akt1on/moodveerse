import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AudioLines, Mic, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PieceCard, Piece } from "@/components/moodverse/PieceCard";
import { InkVortex } from "@/components/moodverse/InkVortex";

type Lang = "ru" | "hy" | "en";
const speechLang: Record<Lang, string> = { ru: "ru-RU", hy: "hy-AM", en: "en-US" };
const labels: Record<Lang, string> = { ru: "Рус", hy: "Հայ", en: "Eng" };

export const PoetryShazam = () => {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("ru");
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Piece | null>(null);
  const [notFound, setNotFound] = useState(false);
  const recRef = useRef<any>(null);
  const heardRef = useRef("");
  const SR: any = typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => () => { try { recRef.current?.abort?.(); } catch {} }, []);

  const search = async (phrase: string) => {
    const q = phrase.trim();
    if (q.length < 3) { setNotFound(true); return; }
    setSearching(true);
    const { data } = await supabase.rpc("match_literary_lexical", {
      query_text: q, preferred_language: lang, match_count: 1,
    });
    setSearching(false);
    const top = (data as any[] | null)?.[0];
    if (!top || top.score < 0.35) { setNotFound(true); return; }
    setResult({
      title: top.title ?? "Без названия", author: top.author,
      year: top.year ? String(top.year) : undefined,
      source_type: (["poem","book","film","quote"].includes(top.source_type) ? top.source_type : "poem"),
      text: top.text, language: top.language,
      explanation: `Услышано: «${q}»`,
      relevance_score: Math.min(100, Math.round(top.score * 100)),
    });
  };

  const start = () => {
    if (!SR) return;
    setResult(null); setNotFound(false); setHeard(""); heardRef.current = "";
    const rec = new SR();
    rec.lang = speechLang[lang]; rec.interimResults = true; rec.continuous = true;
    rec.onresult = (e: any) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript + " ";
      heardRef.current = s.trim(); setHeard(s.trim());
    };
    rec.onend = () => { setListening(false); search(heardRef.current); };
    rec.onerror = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
    setTimeout(() => { try { rec.stop(); } catch {} }, 8000);
  };

  const stop = () => { try { recRef.current?.stop(); } catch {} };

  return (
    <>
      <Button variant="outline" className="rounded-full" onClick={() => setOpen(true)}>
        <AudioLines className="h-4 w-4 mr-2" /> Узнать стих
      </Button>
      <Dialog open={open} onOpenChange={(o) => { if (!o) stop(); setOpen(o); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogTitle className="font-serif">Узнать стих на слух</DialogTitle>
          <DialogDescription>Прочитайте строку вслух или поднесите телефон к звуку.</DialogDescription>
          {!SR ? (
            <p className="text-sm text-muted-foreground">На этом устройстве распознавание речи недоступно. Попробуйте Chrome.</p>
          ) : (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="flex gap-2">
                {(Object.keys(labels) as Lang[]).map((l) => (
                  <Button key={l} size="sm" variant={lang === l ? "default" : "ghost"} className="rounded-full"
                    disabled={listening} onClick={() => setLang(l)}>{labels[l]}</Button>
                ))}
              </div>
              <div className="relative h-[260px] w-[260px] flex items-center justify-center">
                <InkVortex active={listening || searching} />
                <button aria-label={listening ? "Остановить" : "Слушать"} onClick={listening ? stop : start}
                  className="relative z-10 h-20 w-20 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg backdrop-blur-md ring-1 ring-primary-foreground/30 transition-transform hover:scale-105 active:scale-95">
                  {listening ? <Square className="h-7 w-7" /> : <Mic className="h-8 w-8" />}
                </button>
              </div>
              <p className="text-sm text-muted-foreground italic text-center min-h-[1.5rem]">
                {listening ? (heard || "Слушаю строки…") : searching ? "Ищу в библиотеке…" : heard ? `«${heard}»` : "Нажмите и говорите до 8 секунд"}
              </p>
              {notFound && !searching && (
                <p className="text-sm text-center">Не нашёл этот стих в библиотеке. Попробуйте прочитать другую строку чётче.</p>
              )}
            </div>
          )}
          {result && <PieceCard piece={result} index={0} />}
        </DialogContent>
      </Dialog>
    </>
  );
};
