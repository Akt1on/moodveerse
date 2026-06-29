import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookHeart, LogOut, User as UserIcon } from "lucide-react";
import logo from "@/assets/moodverse-logo.png";
import { ThemeSwitcher } from "./ThemeSwitcher";

export const Header = () => {
  const { user, signOut } = useAuth();
  const loc = useLocation();
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
          {link("/", "Резонанс")}
          {user && link("/journal", "Журнал")}
          {user && link("/journey", "Путь")}
          {user && link("/favorites", "Избранное")}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-xs">
                <UserIcon className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} title="Выйти">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/auth"><BookHeart className="h-3.5 w-3.5 mr-1.5" />Войти</Link>
            </Button>
          )}
        </div>
      </div>
      {user && (
        <nav className="md:hidden flex items-center justify-center gap-1 pb-2">
          {link("/", "Резонанс")}
          {link("/journal", "Журнал")}
          {link("/journey", "Путь")}
          {link("/favorites", "Избранное")}
        </nav>
      )}
    </header>
  );
};
