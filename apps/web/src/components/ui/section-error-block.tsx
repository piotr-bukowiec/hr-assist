"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionErrorBlockProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function SectionErrorBlock({
  title = "Wystąpił błąd podczas pobierania danych",
  description = "Nie udało się połączyć z serwerem. Sprawdź połączenie lub spróbuj ponownie.",
  onRetry,
  className,
}: SectionErrorBlockProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[160px] w-full flex-1 flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-foreground transition-all",
        className,
      )}
    >
      <div className="mb-3 rounded-full bg-destructive/10 p-2.5 text-destructive">
        <AlertCircle className="h-5 w-5" />
      </div>

      <h4 className="mb-1 text-xs font-semibold tracking-wider text-foreground uppercase">
        {title}
      </h4>

      <p className="mb-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-7 gap-1.5 border-destructive/30 text-[11px] font-medium text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <RefreshCw className="h-3 w-3" />
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
}
