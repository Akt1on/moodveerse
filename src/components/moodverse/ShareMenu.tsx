import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Mail, MessageCircle, Send, Link2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  title: string;
  text: string;
  url?: string;
};

const SITE = "https://moodveerse.lovable.app";

// Tiny inline brand glyphs so we don't bloat bundle with extra deps.
const Icon = ({ d, className = "" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
);
const Brand = {
  whatsapp:
    "M19.05 4.91A10 10 0 0 0 4.27 18.6L3 22l3.5-1.23A10 10 0 1 0 19.05 4.91Zm-7.04 15.4a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-2.07.73.7-2.02-.2-.32a8.3 8.3 0 1 1 6.1 2.95Zm4.78-6.22c-.26-.13-1.55-.76-1.79-.85-.24-.09-.41-.13-.59.13-.18.26-.67.85-.82 1.02-.15.18-.3.2-.56.07a6.83 6.83 0 0 1-2.01-1.24 7.55 7.55 0 0 1-1.4-1.74c-.15-.26 0-.4.11-.53.11-.11.26-.3.39-.45.13-.15.17-.26.26-.43.09-.18.04-.33-.02-.46-.07-.13-.59-1.42-.81-1.95-.21-.51-.43-.44-.59-.44h-.5a.97.97 0 0 0-.7.33c-.24.26-.92.9-.92 2.2 0 1.31.94 2.57 1.07 2.74.13.18 1.85 2.83 4.49 3.97.63.27 1.12.43 1.5.55.63.2 1.21.17 1.66.1.51-.07 1.55-.63 1.77-1.24.22-.61.22-1.13.16-1.24-.06-.11-.24-.18-.5-.31Z",
  telegram:
    "M21.94 4.31c-.13-.5-.66-.78-1.16-.62L2.71 10.4c-.5.16-.8.66-.66 1.16.06.22.21.41.41.52l4.28 2.36 1.7 5.42c.15.49.7.74 1.18.55.13-.05.24-.13.34-.23l2.62-2.62 4.79 3.52c.45.33 1.09.16 1.31-.36L22 4.94c.04-.21.02-.43-.06-.63ZM9.41 14.4l-.82 4.16-1.14-3.62 9.45-7.31-7.49 6.77Z",
  twitter:
    "M18.9 4H21l-6.46 7.39L22 20h-6.16l-4.83-6.32L5.4 20H3.3l6.92-7.92L2 4h6.31l4.36 5.77L18.9 4Zm-1.08 14.4h1.69L7.27 5.5H5.45l12.37 12.9Z",
  facebook:
    "M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z",
  vk:
    "M21.55 7.6c.15-.5 0-.86-.7-.86h-2.31c-.59 0-.87.31-1.02.66 0 0-1.18 2.88-2.86 4.74-.54.55-.79.72-1.08.72-.15 0-.36-.17-.36-.66V7.6c0-.6-.17-.86-.66-.86H9.92c-.37 0-.59.27-.59.53 0 .57.85.7.94 2.31v3.49c0 .76-.14.9-.43.9-.79 0-2.71-2.89-3.85-6.2-.22-.65-.45-.92-1.04-.92H2.64c-.66 0-.79.31-.79.66 0 .62.79 3.69 3.66 7.74 1.92 2.77 4.62 4.27 7.07 4.27 1.48 0 1.66-.33 1.66-.91v-2.1c0-.66.14-.79.61-.79.34 0 .94.17 2.32 1.51 1.58 1.57 1.84 2.29 2.74 2.29h2.3c.66 0 .98-.33.79-.97-.21-.65-.96-1.6-1.96-2.72-.55-.66-1.36-1.36-1.62-1.71-.36-.45-.26-.65 0-1.06 0 0 2.85-4.02 3.13-5.39Z",
  reddit:
    "M22 12.1c0-1.2-.97-2.16-2.17-2.16-.6 0-1.13.24-1.52.62a10.5 10.5 0 0 0-5.62-1.78l1-4.45 3.1.7c0 .77.62 1.4 1.4 1.4.78 0 1.4-.64 1.4-1.42S18.97 4 18.18 4c-.55 0-1.03.32-1.27.78l-3.45-.78c-.18-.04-.36.07-.4.25l-1.1 4.93c-2.2.06-4.18.7-5.7 1.78A2.16 2.16 0 0 0 4.74 9.94 2.17 2.17 0 0 0 3.6 14a4.4 4.4 0 0 0-.06.7c0 3.55 4.13 6.43 9.23 6.43 5.1 0 9.23-2.88 9.23-6.43 0-.24-.02-.47-.06-.7.66-.39 1.06-1.1 1.06-1.9ZM7 13.5a1.46 1.46 0 1 1 2.92 0 1.46 1.46 0 0 1-2.92 0Zm8.4 4.05a5.6 5.6 0 0 1-3.4.95c-1.27 0-2.46-.27-3.4-.95a.36.36 0 1 1 .43-.58c.78.57 1.83.83 2.97.83 1.14 0 2.19-.26 2.97-.83a.36.36 0 0 1 .43.58Zm.21-2.6a1.46 1.46 0 1 1 0-2.92 1.46 1.46 0 0 1 0 2.92Z",
  linkedin:
    "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.99 0 1.78-.77 1.78-1.72V1.72C24 .77 23.21 0 22.22 0Z",
  viber:
    "M11.4 0C5.2 0 .12 4.86.04 10.86c-.03 1.85.4 3.7 1.27 5.34l-1.3 4.4 4.51-1.18a10.7 10.7 0 0 0 5.13 1.32h.04c6.2 0 11.28-4.86 11.36-10.86C21.13 4.86 16.06 0 11.4 0Zm.05 19.65a8.86 8.86 0 0 1-4.51-1.23l-.32-.19-2.7.71.72-2.62-.21-.34a8.84 8.84 0 0 1-1.36-4.7C3.13 6.27 6.85 2.55 11.45 2.55s8.34 3.72 8.34 8.32-3.74 8.78-8.34 8.78Z",
};

const openShare = (href: string) =>
  window.open(href, "_blank", "noopener,noreferrer,width=720,height=600");

export const ShareMenu = ({ title, text, url = SITE }: Props) => {
  const [copied, setCopied] = useState(false);
  const fullText = `${text}\n\n— ${title}\n\n${url}`;
  const enc = encodeURIComponent;
  const shareUrl = enc(url);
  const shareTitle = enc(title);
  const shareText = enc(`${text}\n\n— ${title}`);
  const shareCombined = enc(fullText);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("Скопировано");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const native = async () => {
    if (!navigator.share) return false;
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="rounded-full text-xs h-8">
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          Поделиться
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-card/95 backdrop-blur-xl">
        <DropdownMenuLabel className="text-xs font-serif italic text-muted-foreground">
          Поделиться откликом
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {typeof navigator !== "undefined" && "share" in navigator && (
          <DropdownMenuItem onClick={native} className="gap-2 cursor-pointer">
            <Share2 className="h-4 w-4 text-primary" /> На устройстве…
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => openShare(`https://api.whatsapp.com/send?text=${shareCombined}`)} className="gap-2 cursor-pointer">
          <Icon d={Brand.whatsapp} className="text-[#25D366]" /> WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShare(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`)} className="gap-2 cursor-pointer">
          <Icon d={Brand.telegram} className="text-[#229ED9]" /> Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShare(`viber://forward?text=${shareCombined}`)} className="gap-2 cursor-pointer">
          <Icon d={Brand.viber} className="text-[#7360F2]" /> Viber
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShare(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`)} className="gap-2 cursor-pointer">
          <Icon d={Brand.twitter} className="text-foreground" /> X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`)} className="gap-2 cursor-pointer">
          <Icon d={Brand.facebook} className="text-[#1877F2]" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShare(`https://vk.com/share.php?url=${shareUrl}&title=${shareTitle}&description=${shareText}`)} className="gap-2 cursor-pointer">
          <Icon d={Brand.vk} className="text-[#0077FF]" /> ВКонтакте
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`)} className="gap-2 cursor-pointer">
          <Icon d={Brand.linkedin} className="text-[#0A66C2]" /> LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShare(`https://www.reddit.com/submit?url=${shareUrl}&title=${shareTitle}`)} className="gap-2 cursor-pointer">
          <Icon d={Brand.reddit} className="text-[#FF4500]" /> Reddit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => (window.location.href = `mailto:?subject=${shareTitle}&body=${shareCombined}`)} className="gap-2 cursor-pointer">
          <Mail className="h-4 w-4 text-muted-foreground" /> Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => (window.location.href = `sms:?&body=${shareCombined}`)} className="gap-2 cursor-pointer">
          <MessageCircle className="h-4 w-4 text-muted-foreground" /> SMS
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copy} className="gap-2 cursor-pointer">
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          {copied ? "Скопировано" : "Скопировать текст"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={async () => { await navigator.clipboard.writeText(url); toast.success("Ссылка скопирована"); }} className="gap-2 cursor-pointer">
          <Link2 className="h-4 w-4 text-muted-foreground" /> Скопировать ссылку
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
