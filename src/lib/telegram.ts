// Telegram Mini App integration: activates only when opened inside Telegram.
type TgWebApp = {
  initData: string;
  colorScheme?: "light" | "dark";
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  openLink?: (url: string) => void;
};

export const getTelegram = (): TgWebApp | null => {
  const tg = (window as any)?.Telegram?.WebApp as TgWebApp | undefined;
  return tg && tg.initData ? tg : null;
};

export const isTelegram = () => !!getTelegram();

export function initTelegram() {
  const tg = getTelegram();
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor?.("#eef3f8");
    tg.setBackgroundColor?.("#eef3f8");
    document.documentElement.classList.add("tg-app");
    if (tg.colorScheme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {
    console.warn("Telegram init failed", e);
  }
}
