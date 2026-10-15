import { isValid, parseISO } from "date-fns";

const DEFAULT_APP_START_DATE = "2026-01-01";

/** Accepts only a real YYYY-MM-DD date; anything else falls back to the default. */
const resolveAppStartDate = (value: string | undefined): string =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value))
    ? value
    : DEFAULT_APP_START_DATE;

/**
 * Application start date (ISO, YYYY-MM-DD) — the earliest day the system keeps
 * records for. Forms and calendars never go below it. Configured with
 * `NEXT_PUBLIC_APP_START_DATE` (inlined at build time — restart `next dev` after
 * changing it); must match `APP_START_DATE` in the API.
 */
export const APP_START_DATE_ISO = resolveAppStartDate(
  process.env.NEXT_PUBLIC_APP_START_DATE,
);

/** `APP_START_DATE_ISO` sparsowane w strefie lokalnej (parseISO dla samej daty nie przesuwa o UTC). */
export const APP_START_DATE: Date = parseISO(APP_START_DATE_ISO);

/**
 * Ile lat w przód można przeglądać/planować kalendarz (zgodnie z walidacją
 * backendu: rok bieżący + 5). Limit obejmuje cały ostatni rok — do grudnia.
 */
export const APP_MAX_YEARS_AHEAD = 5;
