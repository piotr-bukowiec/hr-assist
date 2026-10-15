"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTH_NAMES } from "@/utils/calendar.types";
import {
  CalendarBounds,
  getAvailableMonths,
  getAvailableYears,
} from "@/utils/month.utils";

// Przyciski shadcn przesuwają się o 1px przy kliknięciu — w kontrolkach dat to
// wygląda jak "skok", więc wyłączamy to przesunięcie.
const STABLE_BUTTON_CLASS = "active:not-aria-[haspopup]:translate-y-0";

interface DateControlsProps {
  month: number; // 1-12
  year: number;
  /**
   * Okres zatrudnienia (miesiące 1-12) — listy lat i miesięcy zawierają tylko
   * wartości z tego zakresu, pozostałych w ogóle nie pokazujemy.
   */
  bounds: CalendarBounds;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday?: () => void;
  /** Przycisk "Dziś" — zbędny np. w raporcie, gdzie bieżący miesiąc jest niedostępny. */
  showTodayButton?: boolean;
}

export function DateControls({
  month,
  year,
  bounds,
  onMonthChange,
  onYearChange,
  onPrevMonth,
  onNextMonth,
  onToday,
  showTodayButton = true,
}: DateControlsProps) {
  const yearOptions = getAvailableYears(bounds);
  const monthOptions = getAvailableMonths(year, bounds);

  const isAtMinPeriod =
    year < bounds.min.year ||
    (year === bounds.min.year && month <= bounds.min.month);

  const isAtMaxPeriod =
    year > bounds.max.year ||
    (year === bounds.max.year && month >= bounds.max.month);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrevMonth}
        disabled={isAtMinPeriod}
        className={STABLE_BUTTON_CLASS}
        aria-label="Poprzedni miesiąc"
      >
        <ChevronLeft />
      </Button>

      <Select
        value={month.toString()}
        onValueChange={(value) => onMonthChange(Number(value))}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Miesiąc">
            {MONTH_NAMES[month - 1]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {/* Miesiące w zakresie 1-12, a MONTH_NAMES indeksowane od 0 */}
          {monthOptions.map((monthOption) => (
            <SelectItem key={monthOption} value={monthOption.toString()}>
              {MONTH_NAMES[monthOption - 1]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={year.toString()}
        onValueChange={(value) => onYearChange(Number(value))}
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Rok">{year}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {yearOptions.map((yearOption) => (
            <SelectItem key={yearOption} value={yearOption.toString()}>
              {yearOption}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={onNextMonth}
        disabled={isAtMaxPeriod}
        className={STABLE_BUTTON_CLASS}
        aria-label="Następny miesiąc"
      >
        <ChevronRight />
      </Button>

      {showTodayButton && (
        <Button
          variant="outline-primary"
          onClick={onToday}
          className={STABLE_BUTTON_CLASS}
        >
          Dziś
        </Button>
      )}
    </div>
  );
}
