import {
  addMonths,
  addYears,
  endOfYear,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  startOfMonth,
} from "date-fns";
import { APP_MAX_YEARS_AHEAD, APP_START_DATE } from "@/lib/constants";

/**
 * Miesiąc kalendarza w konwencji backendu i kluczy zapytań: 1-12 (styczeń = 1).
 * To JEDYNE miejsce, które przelicza go na/z 0-indeksowanych miesięcy `Date`.
 */
export interface CalendarPeriod {
  year: number;
  month: number; // 1-12
}

export const toCalendarPeriod = (date: Date): CalendarPeriod => ({
  year: getYear(date),
  month: getMonth(date) + 1,
});

export const periodStartDate = ({ year, month }: CalendarPeriod): Date =>
  startOfMonth(new Date(year, month - 1, 1));

/** Globalnie najwcześniejszy miesiąc kalendarza — wynika z daty startu aplikacji. */
export const MIN_CALENDAR_PERIOD: CalendarPeriod =
  toCalendarPeriod(APP_START_DATE);

/**
 * Najwcześniejszy miesiąc dla konkretnego pracownika: miesiąc zatrudnienia,
 * ale nigdy wcześniej niż start aplikacji (np. zatrudniony 16.09.2026 → wrzesień 2026).
 */
export const getMinCalendarPeriod = (hireDate: Date | null): CalendarPeriod =>
  hireDate && isAfter(hireDate, APP_START_DATE)
    ? toCalendarPeriod(hireDate)
    : MIN_CALENDAR_PERIOD;

export const isBeforeMinPeriod = (
  period: CalendarPeriod,
  minPeriod: CalendarPeriod = MIN_CALENDAR_PERIOD,
): boolean => isBefore(periodStartDate(period), periodStartDate(minPeriod));

/**
 * Najpóźniejszy miesiąc dostępny w kalendarzu: grudzień roku bieżący + 5
 * (np. we wrześniu 2026 → grudzień 2031). Liczony od dzisiejszej daty przy
 * każdym wywołaniu, więc po Nowym Roku limit przesuwa się sam.
 */
export const getMaxCalendarPeriod = (today: Date = new Date()): CalendarPeriod =>
  toCalendarPeriod(endOfYear(addYears(today, APP_MAX_YEARS_AHEAD)));

const isAfterPeriod = (period: CalendarPeriod, other: CalendarPeriod): boolean =>
  isAfter(periodStartDate(period), periodStartDate(other));

/** Zakres miesięcy (1-12), po których można się poruszać w kalendarzu pracownika. */
export interface CalendarBounds {
  min: CalendarPeriod;
  max: CalendarPeriod;
}

/**
 * Okres zatrudnienia przycięty do limitów aplikacji:
 * - od: miesiąc zatrudnienia (nie wcześniej niż start aplikacji),
 * - do: miesiąc zwolnienia, a bez zwolnienia — grudzień roku bieżący + 5.
 */
export const getEmploymentBounds = (
  hireDate: Date | null,
  firedDate: Date | null,
  today: Date = new Date(),
): CalendarBounds => {
  const min = getMinCalendarPeriod(hireDate);
  const appMax = getMaxCalendarPeriod(today);
  const firedPeriod = firedDate ? toCalendarPeriod(firedDate) : null;
  const max =
    firedPeriod && isAfterPeriod(appMax, firedPeriod) ? firedPeriod : appMax;

  // Zwolnienie przed początkiem zakresu — zostaje sam miesiąc początkowy.
  return { min, max: isBeforeMinPeriod(max, min) ? min : max };
};

/**
 * Zakres miesięcy, za które można wygenerować raport:
 * - od: miesiąc zatrudnienia (nie wcześniej niż start aplikacji),
 * - do: ostatni zamknięty miesiąc (poprzedni względem `today`), a przy
 *   zwolnieniu — najpóźniej miesiąc zwolnienia.
 * Zwraca null, gdy żaden miesiąc nie jest jeszcze zamknięty (np. zatrudnienie
 * w bieżącym miesiącu).
 */
export const getReportBounds = (
  hireDate: Date | null,
  firedDate: Date | null,
  today: Date = new Date(),
): CalendarBounds | null => {
  const min = getMinCalendarPeriod(hireDate);
  const lastClosed = toCalendarPeriod(addMonths(startOfMonth(today), -1));
  const firedPeriod = firedDate ? toCalendarPeriod(firedDate) : null;
  const max =
    firedPeriod && isAfterPeriod(lastClosed, firedPeriod)
      ? firedPeriod
      : lastClosed;

  return isBeforeMinPeriod(max, min) ? null : { min, max };
};

/** Zwraca okres mieszczący się w `bounds` (domyślnie: limity aplikacji). */
export const clampPeriod = (
  period: CalendarPeriod,
  bounds: CalendarBounds = getEmploymentBounds(null, null),
): CalendarPeriod => {
  if (isBeforeMinPeriod(period, bounds.min)) return bounds.min;
  if (isAfterPeriod(period, bounds.max)) return bounds.max;
  return period;
};

/** Przesuwa okres o `delta` miesięcy — date-fns obsługuje przejście przez granicę roku. */
export const shiftPeriod = (
  period: CalendarPeriod,
  delta: number,
  bounds?: CalendarBounds,
): CalendarPeriod =>
  clampPeriod(
    toCalendarPeriod(addMonths(periodStartDate(period), delta)),
    bounds,
  );

/** Lata dostępne w `bounds` (np. zatrudnienie 08.2026–10.2028 → 2026, 2027, 2028). */
export const getAvailableYears = ({ min, max }: CalendarBounds): number[] =>
  Array.from({ length: max.year - min.year + 1 }, (_, index) => min.year + index);

/**
 * Miesiące (1-12) dostępne w danym roku — w roku zatrudnienia od jego miesiąca,
 * w roku zwolnienia do jego miesiąca, w latach pomiędzy wszystkie 12.
 */
export const getAvailableMonths = (
  year: number,
  { min, max }: CalendarBounds,
): number[] => {
  const firstMonth = year === min.year ? min.month : 1;
  const lastMonth = year === max.year ? max.month : 12;

  return Array.from(
    { length: Math.max(lastMonth - firstMonth + 1, 0) },
    (_, index) => firstMonth + index,
  );
};
