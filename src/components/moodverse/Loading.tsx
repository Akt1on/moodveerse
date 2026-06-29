import { useEffect, useState } from "react";

const messages = [
  "Ищем слова, которые отзовутся в душе…",
  "Перебираем строки великих поэтов…",
  "Слушаем тишину между строк…",
  "Складываем нужные созвучия…",
  "Сверяем биение строк с биением сердца…",
];

const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="rounded-3xl bg-gradient-card backdrop-blur-md border border-border/60 p-6 sm:p-8 shadow-card animate-fade-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between mb-5">
      <div className="h-5 w-24 rounded-full bg-muted/60 animate-shimmer" />
      <div className="h-4 w-10 rounded-full bg-muted/60 animate-shimmer" />
    </div>
    <div className="space-y-3">
      {[92, 78, 86, 64, 70].map((w, i) => (
        <div key={i} className="h-4 rounded-md bg-muted/50 animate-shimmer" style={{ width: `${w}%` }} />
      ))}
    </div>
    <div className="mt-6 pt-4 border-t border-border/40 space-y-2">
      <div className="h-3 w-1/3 rounded-md bg-muted/50 animate-shimmer" />
      <div className="h-3 w-2/3 rounded-md bg-muted/40 animate-shimmer" />
    </div>
  </div>
);

export const Loading = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % messages.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="animate-fade-up">
      <div className="flex flex-col items-center justify-center pb-8">
        <div className="relative h-12 w-12 mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-button blur-xl opacity-50 animate-shimmer" />
          <div className="absolute inset-2 rounded-full bg-gradient-button animate-pulse" />
        </div>
        <p className="font-serif italic text-base sm:text-lg text-foreground/80 text-center max-w-md text-balance transition-soft">
          {messages[idx]}
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
        <SkeletonCard delay={0} />
        <SkeletonCard delay={120} />
        <SkeletonCard delay={240} />
        <SkeletonCard delay={360} />
      </div>
    </div>
  );
};
