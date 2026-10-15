import { ContractType, Location } from "@/types";
import { z } from "zod";
import {
  addYears,
  endOfYear,
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { pl } from "date-fns/locale";
import { validatePolish } from "validate-polish";
import { ApiService } from "@/services/api.service";
import { APP_START_DATE } from "@/lib/constants";

const fullHourRegex = /^([01]\d|2[0-3]):00/;

const parseHourToNumber = (timeStr: string): number => {
  return parseInt(timeStr.split(":")[0], 10);
};

const isPeselTaken = async (pesel: string): Promise<boolean> => {
  const isAvailable: boolean = await ApiService.isPeselAvailable(pesel);
  return !isAvailable;
};

/** Employment date lower bound — the app start date (2026-01-01). */
export const EARLIEST_EMPLOYMENT_DATE = APP_START_DATE;

/** Employment date upper bound — 31 December of next year (e.g. 2027-12-31 in 2026). */
export const getLatestEmploymentDate = (today: Date = new Date()): Date =>
  startOfDay(endOfYear(addYears(today, 1)));

const formatBoundDate = (date: Date): string =>
  format(date, "d MMMM yyyy", { locale: pl });

/** Dane edytowanego pracownika potrzebne do walidacji asynchronicznej. */
export interface EditedEmployeeContext {
  employeeId: string;
  pesel: string;
  leave: LeaveDays;
  /** Original employment date (yyyy-MM-dd). */
  employmentDate: string;
}

type LeaveDays = 20 | 26;

const LEAVE_EXCESS_MESSAGE =
  "Nadmiar urlopów — pracownik wykorzystał w tym roku więcej dni, niż pozwala nowy wymiar";

const LEAVES_BEFORE_EMPLOYMENT_DATE_MESSAGE =
  "Nie można zmienić daty zatrudnienia na późniejszą, ponieważ pracownik ma zarejestrowane urlopy przed tą datą";

/**
 * Caches async check results per key for the schema's lifetime — `onChange`
 * mode re-validates the whole schema on every keystroke, while the answer only
 * depends on the key. Failed requests are not cached, so they get retried.
 */
const memoizeAsyncCheck = <K>(check: (key: K) => Promise<boolean>) => {
  const results = new Map<K, Promise<boolean>>();

  return (key: K): Promise<boolean> => {
    const cached = results.get(key);
    if (cached) return cached;

    const result = check(key);
    result.catch(() => results.delete(key));
    results.set(key, result);
    return result;
  };
};

/**
 * Schemat formularza pracownika. W trybie edycji (`edited`):
 * - sprawdzenie dostępności PESEL pomija obecny PESEL pracownika
 *   (backend też wyklucza bieżącego pracownika),
 * - zmiana wymiaru urlopu jest sprawdzana w API (`canLeaveBeSet`),
 * - moving the employment date later is checked against registered leaves
 *   (`hasLeavesBeforeGivenDate`).
 */
export const createEmployeeSchema = (edited?: EditedEmployeeContext) => {
  const canLeaveBeSet = memoizeAsyncCheck((leave: LeaveDays) =>
    ApiService.canLeaveBeSet(edited?.employeeId ?? "", leave),
  );
  const hasLeavesBefore = memoizeAsyncCheck((date: string) =>
    ApiService.hasLeavesBeforeGivenDate(edited?.employeeId ?? "", date),
  );

  // Resolved once per schema (i.e. per open form), so it follows the current year.
  const latestEmploymentDate = getLatestEmploymentDate();
  const employmentDateRangeMessage = `Data musi mieścić się w przedziale ${formatBoundDate(
    EARLIEST_EMPLOYMENT_DATE,
  )} – ${formatBoundDate(latestEmploymentDate)}`;

  // Zod keeps running refinements after an earlier one fails, so the async
  // leave check re-uses this guard to never query the API with a bad date.
  const isWithinEmploymentRange = (value: string): boolean => {
    const date = parseISO(value);
    return (
      isValid(date) &&
      !isBefore(date, EARLIEST_EMPLOYMENT_DATE) &&
      !isAfter(date, latestEmploymentDate)
    );
  };

  return z
    .object({
      name: z.string().min(1, "Imię jest wymagane"),
      surname: z.string().min(1, "Nazwisko jest wymagane"),
      pesel: z.string().superRefine(async (value, ctx) => {
        if (value.length !== 11) {
          ctx.addIssue({
            code: "custom",
            message: "PESEL musi mieć dokładnie 11 cyfr",
          });
          return;
        }

        if (!validatePolish.pesel(value)) {
          ctx.addIssue({
            code: "custom",
            message: "Nieprawidłowy numer PESEL",
          });
          return;
        }

        // Własny (niezmieniony) PESEL edytowanego pracownika nie jest "zajęty".
        if (value !== edited?.pesel && (await isPeselTaken(value))) {
          ctx.addIssue({
            code: "custom",
            message: "Ten numer PESEL jest już zajęty w systemie",
          });
        }
      }),
      position: z.string().min(1, "Stanowisko jest wymagane"),
      location: z.enum(Location, { message: "Wybierz lokalizację" }),
      company: z.string().min(1, "Wybierz firmę"),
      workHours: z.number().int().min(1, "Wybierz wymiar etatu").max(10),
      workSchedule: z.object({
        start: z
          .string()
          .min(1, "Wybierz godzinę startu")
          .regex(fullHourRegex, { message: "Wymagana pełna godzina (HH:00)" }),
        end: z
          .string()
          .min(1, "Wyliczana automatycznie")
          .regex(fullHourRegex, { message: "Wymagana pełna godzina (HH:00)" }),
      }),
      employmentDate: z
        .string()
        .min(1, "Data rozpoczęcia jest wymagana")
        // "yyyy-MM-dd" parsed as a local date (not UTC, unlike `new Date(...)`).
        .refine((value) => isValid(parseISO(value)), "Nieprawidłowa data")
        .refine(
          (value) =>
            !isValid(parseISO(value)) || isWithinEmploymentRange(value),
          employmentDateRangeMessage,
        )
        .superRefine(async (value, ctx) => {
          // Edit only, and only when the date moves strictly later — leaves
          // registered before the new date would fall outside the employment.
          if (!edited || !isWithinEmploymentRange(value)) return;
          if (!isAfter(parseISO(value), parseISO(edited.employmentDate)))
            return;

          try {
            if (await hasLeavesBefore(value)) {
              ctx.addIssue({
                code: "custom",
                message: LEAVES_BEFORE_EMPLOYMENT_DATE_MESSAGE,
              });
            }
          } catch {
            ctx.addIssue({
              code: "custom",
              message: "Nie udało się sprawdzić urlopów — spróbuj ponownie",
            });
          }
        }),
      contractType: z.enum(ContractType, { message: "Wybierz typ umowy" }),
      leave: z
        .union([z.literal(20), z.literal(26)], {
          message: "Wybierz wymiar urlopu rocznego",
        })
        .superRefine(async (value, ctx) => {
          // Tylko edycja i tylko faktyczna zmiana wymiaru.
          if (!edited || value === edited.leave) return;

          try {
            if (!(await canLeaveBeSet(value))) {
              ctx.addIssue({ code: "custom", message: LEAVE_EXCESS_MESSAGE });
            }
          } catch {
            ctx.addIssue({
              code: "custom",
              message:
                "Nie udało się sprawdzić limitu urlopu — spróbuj ponownie",
            });
          }
        }),
    })
    .refine(
      (data) => {
        const startHour = parseHourToNumber(data.workSchedule.start);
        const endHour = parseHourToNumber(data.workSchedule.end);

        if (startHour < 6 || startHour > 15 || endHour > 16) {
          return false;
        }

        if (endHour <= startHour) {
          return false;
        }

        const difference = endHour - startHour;
        if (difference !== data.workHours) {
          return false;
        }

        return true;
      },
      {
        message:
          "Godziny pracy muszą mieścić się w przedziale 06:00 - 16:00, a ich różnica musi odpowiadać wymiarowi etatu.",
        path: ["workSchedule", "end"],
      },
    );
};

export type EmployeeFormValues = z.infer<
  ReturnType<typeof createEmployeeSchema>
>;

export type RememberedEmployeeFields = Pick<
  EmployeeFormValues,
  "location" | "position" | "workHours" | "workSchedule" | "leave"
>;

export const LAST_EMPLOYEE_DEFAULTS_QUERY_KEY = [
  "employeeFormLastDefaults",
] as const;

export const pickRememberedFields = (
  data: EmployeeFormValues,
): RememberedEmployeeFields => {
  const { location, position, workHours, workSchedule, leave } = data;
  return { location, position, workHours, workSchedule, leave };
};

export const getDefaultEmployeeFormValues = (
  initialData?: Partial<EmployeeFormValues>,
): EmployeeFormValues => {
  return {
    name: "",
    surname: "",
    pesel: "",
    position: "",
    location: Location.OFFICE,
    company: "",
    workHours: 8,
    workSchedule: {
      start: "08:00",
      end: "16:00",
    },
    employmentDate: format(new Date(), "yyyy-MM-dd"),
    contractType: ContractType.EMPLOYMENT_CONTRACT,
    leave: 20,
    ...initialData,
  };
};
