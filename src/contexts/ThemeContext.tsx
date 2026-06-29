import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Theme = "mist" | "midnight" | "sepia" | "forest";

export const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "mist", label: "Туман", swatch: "linear-gradient(135deg,#dbe7f1,#7ba8c9)" },
  { id: "midnight", label: "Полночь", swatch: "linear-gradient(135deg,#1a2434,#3d5680)" },
  { id: "sepia", label: "Сепия", swatch: "linear-gradient(135deg,#f4ead5,#c9a16b)" },
  { id: "forest", label: "Лес", swatch: "linear-gradient(135deg,#dde7d8,#5a8267)" },
];

const KEY = "moodverse_theme_v1";
const ALL_CLASSES = ["theme-mist", "theme-midnight", "theme-sepia", "theme-forest"];

type Ctx = { theme: Theme; setTheme: (t: Theme) => void };
const ThemeCtx = createContext<Ctx>({ theme: "mist", setTheme: () => {} });

const apply = (t: Theme) => {
  const root = document.documentElement;
  ALL_CLASSES.forEach(c => root.classList.remove(c));
  root.classList.toggle("dark", t === "midnight");
  root.classList.add(`theme-${t}`);
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "mist";
    const saved = localStorage.getItem(KEY) as Theme | null;
    return saved && ALL_CLASSES.includes(`theme-${saved}`) ? saved : "mist";
  });

  useEffect(() => { apply(theme); }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(KEY, t); } catch {}
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
};

export const useTheme = () => useContext(ThemeCtx);