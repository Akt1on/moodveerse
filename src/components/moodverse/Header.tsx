import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookHeart, LogOut, User as UserIcon } from "lucide-react";
import logo from "@/assets/moodverse-logo.png";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useLocale } from "@/contexts/LocaleContext";

export const Header = () => {
  const { user, signOut } = useAuth();
  const loc = useLocation();
  const { t } = useLocale();
  const link = (to: string, label: string) => (
    <Link to={to}
      className={`px-3 py-1.5 rounded-full text-sm transition-soft ${
        loc.pathname === to ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
      }`}>
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/40 border-b border-border/40">
      <div className="container max-w-6xl flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2 group" aria-label="Я раньше здесь бывал — на главную">
          <img
            src={logo}
            alt="Я раньше здесь бывал"
            width={32}
            height={32}
            className="h-8 w-8 transition-soft group-hover:scale-105"
            decoding="async"
          />
          <span className="font-serif text-xl sm:text-2xl italic tracking-wide">Я раньше здесь бывал...</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {link("/", t("nav.resonance"))}
          {user && link("/journal", t("nav.journal"))}
          {user && link("/journey", t("nav.journey"))}
          {user && link("/favorites", t("nav.favorites"))}
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeSwitcher />
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-xs">
                <UserIcon className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} title={t("nav.logout")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/auth"><BookHeart className="h-3.5 w-3.5 mr-1.5" />{t("nav.login")}</Link>
            </Button>
          )}
        </div>
      </div>
      {user && (
        <nav className="md:hidden flex items-center justify-center gap-1 pb-2">
          {link("/", t("nav.resonance"))}
          {link("/journal", t("nav.journal"))}
          {link("/journey", t("nav.journey"))}
          {link("/favorites", t("nav.favorites"))}
        </nav>
      )}
    </header>
  );
};
