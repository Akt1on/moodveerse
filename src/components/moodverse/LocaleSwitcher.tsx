import { Languages, Check } from "lucide-react";
import { LOCALES, useLocale } from "@/contexts/LocaleContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const LocaleSwitcher = () => {
  const { locale, setLocale, t } = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title={t("locale.title")} aria-label={t("locale.title")}>
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="font-serif italic">{t("locale.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map(l => (
          <DropdownMenuItem key={l.id} onClick={() => setLocale(l.id)} className="gap-2 cursor-pointer">
            <span className="inline-flex h-5 w-8 items-center justify-center rounded bg-muted/60 text-[10px] font-medium tracking-wide shrink-0">
              {l.flag}
            </span>
            <span className="flex-1">{l.label}</span>
            {locale === l.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};