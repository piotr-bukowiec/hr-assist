import { cn } from "@/lib/utils";

interface TodayMarkerProps {
  /**
   * Chwilowo zielony — w trakcie zielonego podświetlenia wiersza po kliknięciu
   * "Dziś", żeby czerwony znacznik nie gryzł się z zielonym wierszem.
   */
  isFlashing?: boolean;
  className?: string;
}

export function TodayMarker({ isFlashing = false, className }: TodayMarkerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        // Szerokość (hover) zmienia się szybko, kolor (błysk "Dziś") wygasa wolniej —
        // w tym samym tempie co podświetlenie wiersza.
        "absolute inset-y-0 left-0 z-[1] flex w-1 items-center justify-center overflow-hidden rounded-r-sm [transition:width_200ms_ease-out,background-color_500ms_ease-out] group-hover:w-10",
        isFlashing ? "bg-primary" : "bg-red-600",
        className,
      )}
    >
      <span className="w-full text-center text-[10px] font-bold tracking-wider whitespace-nowrap text-white uppercase opacity-0 transition-opacity duration-150 delay-75 group-hover:opacity-100">
        Dziś
      </span>
    </span>
  );
}
