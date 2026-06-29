import { Palette } from "lucide-react";
import { THEMES, useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Тема оформления" aria-label="Тема оформления">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-serif italic">Атмосфера</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map(t => (
          <DropdownMenuItem key={t.id} onClick={() => setTheme(t.id)} className="gap-2 cursor-pointer">
            <span
              className="inline-block h-4 w-4 rounded-full border border-border/60 shadow-sm shrink-0"
              style={{ background: t.swatch }}
              aria-hidden
            />
            <span className="flex-1">{t.label}</span>
            {theme === t.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};