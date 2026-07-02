import { Button } from "@/components/ui/button";

export const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="min-h-[60vh] flex items-center justify-center px-6">
    <div className="max-w-md text-center space-y-4">
      <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground/70">Тишина прервана</p>
      <h2 className="font-serif italic text-3xl">Что-то пошло не так</h2>
      <p className="font-serif italic text-muted-foreground text-sm break-words">
        {error.message || "Неизвестная ошибка"}
      </p>
      <Button variant="outline" className="rounded-full" onClick={resetErrorBoundary}>
        Попробовать снова
      </Button>
    </div>
  </div>
);