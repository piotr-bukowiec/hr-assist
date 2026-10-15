import {
  format,
  formatDuration,
  intervalToDuration,
  isAfter,
  parse,
  startOfDay,
  type Locale,
} from "date-fns";
import { pl } from "date-fns/locale";
import Fraction from "fraction.js";
import { parseDateOnly } from "@/utils/day.utils";

/** Full-time base used for the work-time fraction (8h = 1/1). */
const FULL_TIME_HOURS = 8;

/**
 * The Polish locale renders singular units without a number ("miesiąc dzień"),
 * which reads oddly next to plural ones ("5 lat miesiąc dzień"). Prefix them
 * with "1" so every unit carries its count ("5 lat 1 miesiąc 1 dzień").
 */
const plWithSingularCounts: Locale = {
  ...pl,
  formatDistance: (token, count, options) => {
    const text = pl.formatDistance(token, count, options);
    return count === 1 && !/^\d/.test(text) ? `1 ${text}` : text;
  },
};

/** "06:00:00" → "6:00" (no leading zero, as in "7:00-13:00"). */
const formatScheduleHour = (time: string): string =>
  format(parse(time.slice(0, 5), "HH:mm", new Date()), "H:mm");

/** e.g. "7:00-13:00 (6h)". */
export const formatWorkSchedule = (
  start: string,
  end: string,
  workHours: number,
): string =>
  `${formatScheduleHour(start)}-${formatScheduleHour(end)} (${workHours}h)`;

/** Work-time fraction of a full-time job, e.g. 6h → "3/4 (6h)", 8h → "1/1 (8h)". */
export const formatWorkTimeFraction = (workHours: number): string => {
  const fraction = new Fraction(workHours, FULL_TIME_HOURS);
  const text = fraction.equals(1) ? "1/1" : fraction.toFraction();
  return `${text} (${workHours}h)`;
};

/** e.g. "16 września 2026". */
export const formatEmploymentDate = (employmentDate: string): string =>
  format(parseDateOnly(employmentDate), "d MMMM yyyy", { locale: pl });

/** Length of service from the employment date until today, e.g. "2 lata 3 miesiące". */
export const formatSeniority = (
  employmentDate: string,
  today: Date = new Date(),
): string => {
  const start = parseDateOnly(employmentDate);
  const end = startOfDay(today);

  if (isAfter(start, end)) return "Zatrudnienie jeszcze się nie rozpoczęło";

  const duration = formatDuration(intervalToDuration({ start, end }), {
    locale: plWithSingularCounts,
    format: ["years", "months", "days"],
    zero: false,
  });

  // Same-day start yields an empty duration.
  return duration || "0 dni";
};
