import { isAfter, isBefore, isWeekend, parseISO, startOfDay } from "date-fns";
import { AttendanceStatus } from "./calendar.types";

/** Harmonogram pracownika używany do wyliczeń godzin w kalendarzu. */
export interface WorkScheduleInfo {
  start: string; // HH:mm lub HH:mm:ss
  end: string;
  workHours: number;
}

export type CalendarDayKind =
  | "preEmployment"
  | "postEmployment"
  | "weekend"
  | "holiday"
  | "workday";

export interface CalendarDayState {
  kind: CalendarDayKind;
  /** Dzień po dzisiejszym — można go planować, ale jeszcze się nie odbył. */
  isFuture: boolean;
  /**
   * Weekend, święto i dni poza okresem zatrudnienia są zawsze zablokowane — także
   * w przyszłości.
   */
  isLocked: boolean;
  /**
   * Status do wyświetlenia:
   * - dzień wolny → null,
   * - przeszły/dzisiejszy dzień bez wpisu → OB (domyślna obecność),
   * - przyszły dzień bez wpisu → null ("Pauza" — dzień jeszcze nieewidencjonowany).
   */
  status: AttendanceStatus | null;
  /** Godziny nominalne z harmonogramu dla każdego dnia roboczego; null dla dni wolnych. */
  nominalHours: number | null;
  /**
   * Godziny realne: pełny wymiar tylko dla obecności (OB), 0 dla każdego innego
   * statusu (urlop, L4, NN, ...). null gdy nie ma czego liczyć (dzień wolny, pauza).
   */
  realHours: number | null;
}

interface DescribeCalendarDayParams {
  date: Date;
  today: Date;
  rawStatus: AttendanceStatus | undefined;
  holidayName: string | null;
  workHours: number;
  /** Data zatrudnienia — dni wcześniejsze nie mają statusu ani godzin. */
  hireDate: Date | null;
  /** Moment zwolnienia — dni po nim też nie mają statusu ani godzin. */
  firedDate: Date | null;
}

/**
 * Parsuje datę z backendu (np. "2026-09-16T00:00:00.000Z") jako dzień w strefie
 * lokalnej — bierzemy tylko część YYYY-MM-DD, żeby strefa czasowa nie
 * przesunęła dnia.
 */
export const parseDateOnly = (value: string): Date =>
  parseISO(value.slice(0, 10));

/** Realne godziny dla statusu — JEDYNE miejsce z regułą "tylko OB liczy się do godzin". */
export const getRealHours = (
  status: AttendanceStatus,
  workHours: number,
): number => (status === AttendanceStatus.PRESENCE ? workHours : 0);

export const describeCalendarDay = ({
  date,
  today,
  rawStatus,
  holidayName,
  workHours,
  hireDate,
  firedDate,
}: DescribeCalendarDayParams): CalendarDayState => {
  const isFuture = isAfter(startOfDay(date), startOfDay(today));
  // Dni sprzed zatrudnienia mają pierwszeństwo przed świętami i weekendami —
  // przed początkiem umowy nie pokazujemy niczego poza datą.
  const isBeforeHire =
    hireDate !== null && isBefore(startOfDay(date), startOfDay(hireDate));
  // Tak samo dni po zwolnieniu — w wierszu zostaje tylko data i dzień tygodnia.
  const isAfterFire =
    firedDate !== null && isAfter(startOfDay(date), startOfDay(firedDate));
  const kind: CalendarDayKind = isBeforeHire
    ? "preEmployment"
    : isAfterFire
      ? "postEmployment"
      : holidayName
        ? "holiday"
        : isWeekend(date)
          ? "weekend"
          : "workday";

  if (kind !== "workday") {
    return {
      kind,
      isFuture,
      isLocked: true,
      status: null,
      nominalHours: null,
      realHours: null,
    };
  }

  // Backend nie przechowuje obecności — OB oznacza brak wpisu. W przyszłości
  // brak wpisu to "Pauza", a w przeszłości domyślna obecność.
  const status = rawStatus ?? (isFuture ? null : AttendanceStatus.PRESENCE);

  // Godziny nominalne i przedział pracy są znane z góry dla każdego dnia
  // roboczego (także przyszłego). Pauza (brak wpisu w przyszłości) ma tylko
  // status i godziny realne jako "—".
  return {
    kind,
    isFuture,
    isLocked: false,
    status,
    nominalHours: workHours,
    realHours: status === null ? null : getRealHours(status, workHours),
  };
};

/** Formatuje godzinę z harmonogramu (HH:mm:ss → HH:mm). */
export const formatScheduleTime = (time: string): string => time.slice(0, 5);
