const messages = [
  "Ищем слова, которые отзовутся в твоей душе...",
  "Перебираем строки великих поэтов...",
  "Слушаем тишину между строк...",
  "Складываем нужные созвучия...",
];

export const Loading = () => {
  const msg = messages[Math.floor(Date.now() / 3000) % messages.length];
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-up">
      <div className="relative h-16 w-16 mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-button blur-xl opacity-50 animate-shimmer" />
        <div className="absolute inset-2 rounded-full bg-gradient-button animate-pulse" />
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
      </div>
      <p className="font-serif italic text-lg text-foreground/80 text-center max-w-md text-balance">{msg}</p>
    </div>
  );
};
