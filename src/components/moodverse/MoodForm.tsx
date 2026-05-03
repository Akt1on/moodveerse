import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Plus, X, Users, Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const EMOTIONS = [
  "Грусть", "Меланхолия", "Одиночество", "Тревога", "Гнев", "Радость",
  "Вдохновение", "Надежда", "Любовь", "Принятие", "Усталость", "Благодарность",
  "Тоска", "Нежность", "Тишина", "Сомнение",
];

const CONTEXTS = ["Отношения", "Работа", "Саморазвитие", "Потеря", "Семья", "Творчество", "Здоровье", "—"];

const LANGUAGES: { value: "any" | "ru" | "hy" | "en"; label: string }[] = [
  { value: "any", label: "Любой" },
  { value: "ru", label: "Русский" },
  { value: "hy", label: "Հայերեն" },
  { value: "en", label: "English" },
];

export type MoodInput = {
  input_text: string;
  emotions: string[];
  intensity: number;
  context: string;
  language_pref?: "any" | "ru" | "hy" | "en";
  mode?: "single" | "council";
};

export const MoodForm = ({ onSubmit, loading }: { onSubmit: (m: MoodInput) => void; loading: boolean }) => {
  const [text, setText] = useState("");
  const [emotions, setEmotions] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [intensity, setIntensity] = useState([6]);
  const [ctx, setCtx] = useState("—");
  const [lang, setLang] = useState<"any" | "ru" | "hy" | "en">("any");
  const [mode, setMode] = useState<"single" | "council">("single");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSupported = typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => () => {
    try { recognitionRef.current?.stop?.(); } catch {}
  }, []);

  const toggleMic = () => {
    if (!speechSupported) {
      toast.error("Голосовой ввод не поддерживается в этом браузере");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang === "en" ? "en-US" : lang === "hy" ? "hy-AM" : "ru-RU";
    rec.interimResults = true;
    rec.continuous = true;
    let baseText = text;
    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (final) {
        baseText = (baseText ? baseText + " " : "") + final.trim();
        setText(baseText);
      } else if (interim) {
        setText((baseText ? baseText + " " : "") + interim);
      }
    };
    rec.onerror = (e: any) => {
      console.error("SR error", e);
      if (e.error !== "aborted") toast.error("Ошибка распознавания");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
      toast.success("Говорите...");
    } catch (err) {
      console.error(err);
      toast.error("Не удалось запустить микрофон");
    }
  };

  const toggle = (e: string) => setEmotions(p => p.includes(e) ? p.filter(x => x !== e) : [...p, e]);
  const addCustom = () => {
    const v = custom.trim();
    if (v && !emotions.includes(v)) setEmotions(p => [...p, v]);
    setCustom("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 3) return;
    onSubmit({
      input_text: text.trim(),
      emotions,
      intensity: intensity[0],
      context: ctx === "—" ? "" : ctx,
      language_pref: lang,
      mode,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6 animate-fade-up">
      <div className="relative">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Опишите, что вы чувствуете прямо сейчас... Какие эмоции, мысли, ощущения? (грусть, одиночество, тревога, надежда, гнев, радость и т.д.)"
          maxLength={2000}
          className="min-h-[160px] resize-none rounded-2xl bg-card/60 backdrop-blur-md border-border/60 px-6 py-5 text-base font-serif italic placeholder:text-muted-foreground/60 placeholder:italic shadow-card focus-visible:ring-primary/40"
        />
        <div className="absolute bottom-3 right-4 text-xs text-muted-foreground/60">
          {text.length}/2000
        </div>
        {speechSupported && (
          <button
            type="button"
            onClick={toggleMic}
            title={listening ? "Остановить запись" : "Надиктовать голосом"}
            className={`absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center border transition-soft ${
              listening
                ? "bg-destructive/15 border-destructive/40 text-destructive animate-pulse"
                : "bg-card/70 border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40"
            }`}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80 text-center">Эмоции (по желанию)</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {[...EMOTIONS, ...emotions.filter(e => !EMOTIONS.includes(e))].map(e => {
            const on = emotions.includes(e);
            return (
              <button type="button" key={e} onClick={() => toggle(e)}
                className={`px-3.5 py-1.5 rounded-full text-sm border transition-soft ${
                  on
                    ? "bg-primary text-primary-foreground border-primary shadow-glow scale-105"
                    : "bg-card/50 text-foreground/80 border-border hover:border-primary/50 hover:bg-card"
                }`}>
                {e}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 justify-center max-w-sm mx-auto">
          <Input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="Своя эмоция..."
            maxLength={30}
            className="rounded-full bg-card/40 border-border/60 text-sm h-9"
          />
          <Button type="button" size="icon" variant="outline" className="rounded-full h-9 w-9 shrink-0" onClick={addCustom}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
            <span>Интенсивность</span><span className="text-primary">{intensity[0]} / 10</span>
          </div>
          <Slider value={intensity} onValueChange={setIntensity} min={1} max={10} step={1} />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Контекст</p>
          <div className="flex flex-wrap gap-1.5">
            {CONTEXTS.map(c => (
              <button type="button" key={c} onClick={() => setCtx(c)}
                className={`px-3 py-1 rounded-full text-xs border transition-soft ${
                  ctx === c ? "bg-accent text-accent-foreground border-accent" : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80 text-center">Язык произведений</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {LANGUAGES.map(l => (
            <button type="button" key={l.value} onClick={() => setLang(l.value)}
              className={`px-3.5 py-1 rounded-full text-xs border transition-soft ${
                lang === l.value ? "bg-accent text-accent-foreground border-accent" : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}>{l.label}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80 text-center">Режим отклика</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button type="button" onClick={() => setMode("single")}
            className={`px-3.5 py-1.5 rounded-full text-xs border transition-soft inline-flex items-center gap-1.5 ${
              mode === "single" ? "bg-accent text-accent-foreground border-accent" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}>
            <Sparkles className="h-3 w-3" /> Один куратор
          </button>
          <button type="button" onClick={() => setMode("council")}
            className={`px-3.5 py-1.5 rounded-full text-xs border transition-soft inline-flex items-center gap-1.5 ${
              mode === "council" ? "bg-accent text-accent-foreground border-accent" : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}>
            <Users className="h-3 w-3" /> Совет 5 кураторов
          </button>
        </div>
        {mode === "council" && (
          <p className="text-[11px] text-muted-foreground/70 text-center italic font-serif">
            🪶 Поэт · 🧭 Философ · 🌿 Целитель · 🎬 Кинокритик · ✨ Мистик
          </p>
        )}
      </div>

      <div className="flex justify-center pt-2">
        <Button
          type="submit"
          disabled={loading || text.trim().length < 3}
          size="lg"
          className="rounded-full px-10 py-6 text-base font-serif italic bg-gradient-button text-primary-foreground shadow-glow hover:shadow-soft hover:scale-[1.02] transition-soft disabled:opacity-50 disabled:hover:scale-100"
        >
          {mode === "council" ? <Users className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {loading ? (mode === "council" ? "Совет совещается..." : "Ищем резонанс...") : (mode === "council" ? "Созвать совет" : "Найти резонанс")}
        </Button>
      </div>
    </form>
  );
};
