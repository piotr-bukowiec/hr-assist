import { z } from "zod";

/**
 * Kopia 1:1 (nazwy i wartości) enuma z backendu:
 * apps/api/src/modules/attendance/attendance.types.ts — zmiany wprowadzać w obu miejscach.
 */
export enum AttendanceStatus {
  PRESENCE = "OB",
  SICK_LEAVE = "CH",
  UNEXCUSED_ABSENCE = "NN",
  UNPAID_LEAVE = "UB",
  VACATION_LEAVE = "UW",
  MATERNITY_LEAVE = "UM",
  UNPAID_EXCUSED_ABSENCE = "NUN",
  PAID_EXCUSED_ABSENCE = "NUP",
  PATERNITY_LEAVE = "UO",
  CARE = "OP",
  REHABILITATION_BENEFIT = "REH",
  PARENTAL_LEAVE = "UR",
  ON_DEMAND_LEAVE = "UŻ",
  CIRCUMSTANTIAL_LEAVE = "UOK",
  DAY_OFF_FOR_HOLIDAY = "WZS",
  PARENTAL_CHILD_LEAVE = "WYC",
}

export interface CalendarRecord {
  date: string;
  status: AttendanceStatus;
}

export interface StatusPresentation {
  code: string;
  label: string;
}

/**
 * Jedyne miejsce definiujące etykiety i skróty statusów frekwencji.
 * `Record` (zamiast `Partial`) wymusza w czasie kompilacji zdefiniowanie
 * prezentacji dla KAŻDEJ wartości `AttendanceStatus` — dodanie nowego
 * statusu do enuma bez uzupełnienia mapy nie przejdzie build'u.
 */
export const STATUS_PRESENTATION: Record<AttendanceStatus, StatusPresentation> =
  {
    [AttendanceStatus.PRESENCE]: { code: "OB", label: "Obecność" },
    [AttendanceStatus.UNEXCUSED_ABSENCE]: {
      code: "NN",
      label: "Nieobecność nieusprawiedliwiona",
    },
    [AttendanceStatus.VACATION_LEAVE]: { code: "UW", label: "Urlop wypoczynkowy" },
    [AttendanceStatus.ON_DEMAND_LEAVE]: { code: "UŻ", label: "Urlop na żądanie" },
    [AttendanceStatus.SICK_LEAVE]: { code: "CH", label: "Zwolnienie lekarskie" },
    [AttendanceStatus.CARE]: { code: "OP", label: "Opieka" },
    [AttendanceStatus.UNPAID_LEAVE]: { code: "UB", label: "Urlop bezpłatny" },
    [AttendanceStatus.MATERNITY_LEAVE]: { code: "UM", label: "Urlop macierzyński" },
    [AttendanceStatus.UNPAID_EXCUSED_ABSENCE]: {
      code: "NUN",
      label: "Nieobecność usprawiedliwiona niepłatna",
    },
    [AttendanceStatus.PAID_EXCUSED_ABSENCE]: {
      code: "NUP",
      label: "Nieobecność usprawiedliwiona płatna",
    },
    [AttendanceStatus.PATERNITY_LEAVE]: { code: "UO", label: "Urlop ojcowski" },
    [AttendanceStatus.REHABILITATION_BENEFIT]: {
      code: "REH",
      label: "Świadczenie rehabilitacyjne",
    },
    [AttendanceStatus.PARENTAL_LEAVE]: { code: "UR", label: "Urlop rodzicielski" },
    [AttendanceStatus.CIRCUMSTANTIAL_LEAVE]: { code: "UOK", label: "Urlop okolicznościowy" },
    [AttendanceStatus.DAY_OFF_FOR_HOLIDAY]: { code: "WZS", label: "Dzień wolny za święto" },
    [AttendanceStatus.PARENTAL_CHILD_LEAVE]: { code: "WYC", label: "Urlop wychowawczy" },
  };

/**
 * Kolejność opcji w modalu — od najczęściej używanych, reszta w kolejności enuma.
 */
const MOST_USED_STATUSES: readonly AttendanceStatus[] = [
  AttendanceStatus.PRESENCE,
  AttendanceStatus.UNEXCUSED_ABSENCE,
  AttendanceStatus.VACATION_LEAVE,
  AttendanceStatus.ON_DEMAND_LEAVE,
  AttendanceStatus.SICK_LEAVE,
];

export const ORDERED_ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  ...MOST_USED_STATUSES,
  ...Object.values(AttendanceStatus).filter(
    (status) => !MOST_USED_STATUSES.includes(status),
  ),
];

/** Warianty `Badge` (components/ui/badge) używane dla statusów w kalendarzu. */
export type StatusBadgeVariant = "success" | "warning" | "destructive" | "info";

/**
 * Kolor statusu: obecność → zielony, nieobecność nieusprawiedliwiona → czerwony,
 * każda inna nieobecność/urlop → żółty. Święta (ŚUW) mają wariant `info` (niebieski).
 */
export const getStatusBadgeVariant = (
  status: AttendanceStatus,
): StatusBadgeVariant => {
  if (status === AttendanceStatus.PRESENCE) return "success";
  if (status === AttendanceStatus.UNEXCUSED_ABSENCE) return "destructive";
  return "warning";
};

/** Zwraca etykietę statusu — jedyne miejsce, które o niej "wie". */
export const getStatusLabel = (status: AttendanceStatus): string =>
  STATUS_PRESENTATION[status].label;

/** Zwraca skrót statusu — jedyne miejsce, które o nim "wie". */
export const getStatusCode = (status: AttendanceStatus): string =>
  STATUS_PRESENTATION[status].code;

/** Statusy traktowane jako urlop — po ich zapisaniu odświeżamy dane o urlopach. */
export const LEAVE_ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  AttendanceStatus.ON_DEMAND_LEAVE,
  AttendanceStatus.VACATION_LEAVE,
];

export const MONTH_NAMES = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
] as const;

export interface CalendarRow {
  date: Date;
  dateKey: string;
  dayNumber: number;
  weekdayLabel: string;
  isWeekend: boolean;
  isToday: boolean;
  status: AttendanceStatus | null;
  scheduleLabel: string;
  nominalHoursLabel: string;
  actualHoursLabel: string;
}

export interface UpdateEmployeeAttendanceDto {
  status: AttendanceStatus;
  date: string;
}

export const updateEmployeeAttendanceSchema = z.object({
  status: z.nativeEnum(AttendanceStatus),
  date: z.string().datetime(),
});

export type UpdateEmployeeAttendanceInput = z.infer<
  typeof updateEmployeeAttendanceSchema
>;
