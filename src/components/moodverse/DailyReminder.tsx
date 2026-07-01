import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocale } from "@/contexts/LocaleContext";

const ENABLED_KEY = "moodverse_reminder_enabled_v1";
const LAST_KEY = "moodverse_reminder_last_v1";
const REMIND_HOUR = 9;

const supported = () => typeof window !== "undefined" && "Notification" in window;

const todayKey = () => new Date().toISOString().slice(0, 10);

const fireIfDue = (title: string) => {
  if (!supported() || Notification.permission !== "granted") return;
  const last = localStorage.getItem(LAST_KEY);
  const today = todayKey();
  const now = new Date();
  if (last === today) return;
  if (now.getHours() < REMIND_HOUR) return;
  try {
    new Notification(title, {
      body: "…",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "moodverse-daily",
    });
    localStorage.setItem(LAST_KEY, today);
  } catch {}
};

export const DailyReminder = () => {
  const { t } = useLocale();
  const [enabled, setEnabled] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!supported()) return;
    setPerm(Notification.permission);
    const e = localStorage.getItem(ENABLED_KEY) === "1";
    setEnabled(e);
    if (e) {
      fireIfDue(t("reminder.title"));
      // check again when the tab regains focus
      const onFocus = () => fireIfDue(t("reminder.title"));
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }
  }, [t]);

  if (!supported()) return null;

  const toggle = async () => {
    if (enabled) {
      localStorage.removeItem(ENABLED_KEY);
      setEnabled(false);
      return;
    }
    if (Notification.permission === "denied") {
      toast.error(t("reminder.blocked"));
      return;
    }
    const p = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
    setPerm(p);
    if (p !== "granted") {
      toast.error(t("reminder.blocked"));
      return;
    }
    localStorage.setItem(ENABLED_KEY, "1");
    setEnabled(true);
    toast.success(t("reminder.enabled"));
    fireIfDue(t("reminder.title"));
  };

  const Icon = enabled ? BellRing : perm === "denied" ? BellOff : Bell;

  return (
    <Button
      size="sm"
      variant={enabled ? "secondary" : "ghost"}
      onClick={toggle}
      className="rounded-full text-xs h-8"
      title={t("reminder.enable")}
    >
      <Icon className={`h-3.5 w-3.5 mr-1.5 ${enabled ? "text-primary" : ""}`} />
      {enabled ? t("reminder.enabled") : t("reminder.enable")}
    </Button>
  );
};