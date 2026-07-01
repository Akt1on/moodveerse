import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Locale = "ru" | "en" | "hy";

export const LOCALES: { id: Locale; label: string; flag: string }[] = [
  { id: "ru", label: "Русский", flag: "РУ" },
  { id: "en", label: "English", flag: "EN" },
  { id: "hy", label: "Հայերեն", flag: "ՀԱ" },
];

const KEY = "moodverse_locale_v1";

type Dict = Record<string, { ru: string; en: string; hy: string }>;

export const DICT: Dict = {
  "nav.resonance":   { ru: "Резонанс",  en: "Resonance", hy: "Ռեզոնանս" },
  "nav.journal":     { ru: "Журнал",    en: "Journal",   hy: "Օրագիր" },
  "nav.journey":     { ru: "Путь",      en: "Journey",   hy: "Ուղի" },
  "nav.favorites":   { ru: "Избранное", en: "Favorites", hy: "Ընտրյալ" },
  "nav.login":       { ru: "Войти",     en: "Sign in",   hy: "Մուտք" },
  "nav.logout":      { ru: "Выйти",     en: "Sign out",  hy: "Ելք" },

  "hero.overline":   { ru: "Я раньше здесь бывал",       en: "I have been here before",           hy: "Ես եղել եմ այստեղ" },
  "hero.title1":     { ru: "Тишина,",                     en: "A silence",                          hy: "Լռություն,"       },
  "hero.title2":     { ru: "что говорит",                 en: "that speaks",                        hy: "որ խոսում է"      },
  "hero.sub":        { ru: "Опишите чувство — и поэзия откликнется именно так, как нужно сейчас.",
                       en: "Describe how you feel — poetry will answer exactly the way you need.",
                       hy: "Նկարագրիր զգացումդ — բանաստեղծությունը կարձագանքի ճիշտ այնպես, ինչպես հիմա պետք է:" },

  "form.placeholder":{ ru: "Опишите, что вы чувствуете прямо сейчас... грусть, тревога, надежда...",
                       en: "Describe what you feel right now... sadness, anxiety, hope...",
                       hy: "Նկարագրիր, թե ինչ ես զգում հենց հիմա... տխրություն, անհանգստություն, հույս..." },
  "form.submit.single":  { ru: "Найти резонанс", en: "Find resonance", hy: "Գտնել ռեզոնանս" },
  "form.submit.council": { ru: "Созвать совет",  en: "Convene council", hy: "Հրավիրել խորհուրդ" },
  "form.loading.single": { ru: "Ищем резонанс...", en: "Seeking resonance...", hy: "Փնտրում ենք ռեզոնանս..." },
  "form.loading.council":{ ru: "Совет совещается...", en: "The council confers...", hy: "Խորհուրդը խորհրդակցում է..." },
  "form.emotions":   { ru: "Эмоции (по желанию)", en: "Emotions (optional)", hy: "Զգացումներ (ընտրովի)" },
  "form.customEmotion":{ ru: "Своя эмоция...",   en: "Your own emotion...", hy: "Քո զգացումը..." },
  "form.intensity":  { ru: "Интенсивность",       en: "Intensity",           hy: "Ինտենսիվություն" },
  "form.context":    { ru: "Контекст",            en: "Context",             hy: "Համատեքստ" },
  "form.language":   { ru: "Язык произведений",   en: "Language of works",   hy: "Ստեղծագործության լեզու" },
  "form.mode":       { ru: "Режим отклика",       en: "Response mode",       hy: "Արձագանքի ռեժիմ" },
  "form.mode.single":{ ru: "Один куратор",        en: "Single curator",      hy: "Մեկ համադրող" },
  "form.mode.council":{ru: "Совет 5 кураторов",   en: "Council of 5",        hy: "5 համադրողների խորհուրդ" },

  "results.new":     { ru: "Новый запрос",        en: "New query",           hy: "Նոր հարցում" },
  "results.count":   { ru: "Найдено {n} откликов", en: "{n} responses found", hy: "Գտնվել է {n} արձագանք" },
  "results.signInPrompt":{ ru: "Войдите, чтобы сохранять отклики и видеть журнал состояний",
                           en: "Sign in to save responses and see your mood journal",
                           hy: "Մուտք գործիր՝ պահելու արձագանքները և տեսնելու օրագիրը" },

  "footer.line":     { ru: "Слова, которые помнят то, что мы забыли о себе",
                       en: "Words that remember what we've forgotten about ourselves",
                       hy: "Բառեր, որոնք հիշում են այն, ինչ մենք մոռացել ենք մեր մասին" },

  "theme.title":     { ru: "Атмосфера", en: "Atmosphere", hy: "Մթնոլորտ" },
  "locale.title":    { ru: "Язык интерфейса", en: "Interface language", hy: "Ինտերֆեյսի լեզու" },

  "reminder.title":  { ru: "Стих дня ждёт вас", en: "Your verse of the day", hy: "Օրվա բանաստեղծությունը" },
  "reminder.enable": { ru: "Напоминать в 9:00", en: "Remind me at 9:00", hy: "Հիշեցնել ժամը 9:00" },
  "reminder.enabled":{ ru: "Напоминания включены", en: "Reminders enabled", hy: "Հիշեցումները միացված են" },
  "reminder.blocked":{ ru: "Уведомления заблокированы браузером", en: "Notifications are blocked by the browser", hy: "Ծանուցումները արգելափակված են" },
};

type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (key: keyof typeof DICT, vars?: Record<string, string | number>) => string };
const LocaleCtx = createContext<Ctx>({ locale: "ru", setLocale: () => {}, t: (k) => String(k) });

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "ru";
    const saved = localStorage.getItem(KEY) as Locale | null;
    if (saved && ["ru", "en", "hy"].includes(saved)) return saved;
    const nav = navigator.language?.toLowerCase() || "";
    if (nav.startsWith("hy")) return "hy";
    if (nav.startsWith("en")) return "en";
    return "ru";
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(KEY, l); } catch {}
  };

  const t = (key: keyof typeof DICT, vars?: Record<string, string | number>) => {
    const entry = DICT[key];
    let s = entry ? entry[locale] : String(key);
    if (vars) for (const k in vars) s = s.replace(`{${k}}`, String(vars[k]));
    return s;
  };

  const value = useMemo(() => ({ locale, setLocale, t }), [locale]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
};

export const useLocale = () => useContext(LocaleCtx);