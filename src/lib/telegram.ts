// Telegram Mini App integration: activates only when opened inside Telegram.
type TgWebApp = {
  initData: string;
  platform?: string;
  colorScheme?: "light" | "dark";
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  openLink?: (url: string) => void;
  onEvent?: (e: string, cb: () => void) => void;
};

export const getTelegram = (): TgWebApp | null => {
  const tg = (window as any)?.Telegram?.WebApp as TgWebApp | undefined;
  if (!tg) return null;
  // initData may be empty on Desktop/test links; platform "unknown" means a plain browser.
  if (tg.initData || (tg.platform && tg.platform !== "unknown")) return tg;
  return null;
};

export const isTelegram = () => !!getTelegram();

function applyTheme(tg: TgWebApp) {
  const dark = tg.colorScheme === "dark";
  document.documentElement.classList.toggle("dark", dark);
  // Read the actual themed background so header matches current palette.
  const bg = getComputedStyle(document.body).backgroundColor;
  const hex = rgbToHex(bg) ?? (dark ? "#0f1620" : "#eef3f8");
  tg.setHeaderColor?.(hex);
  tg.setBackgroundColor?.(hex);
}

function rgbToHex(rgb: string): string | null {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return null;
  return "#" + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
}

export function initTelegram() {
  const tg = getTelegram();
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
    document.documentElement.classList.add("tg-app");
    requestAnimationFrame(() => applyTheme(tg));
    tg.onEvent?.("themeChanged", () => applyTheme(tg));
  } catch (e) {
    console.warn("Telegram init failed", e);
  }
}
