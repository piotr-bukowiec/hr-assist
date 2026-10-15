"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SectionErrorBlock } from "@/components/ui/section-error-block";
import { DateControls } from "./DateControls";
import { CalendarTable, FocusedDay } from "./CalendarTable";
import { RowHighlightTone } from "./CalendarRow";
import { UnexcusedAbsencesBell } from "./UnexcusedAbsencesBell";
import { CalendarRecord, AttendanceStatus } from "@/utils/calendar.types";
import { ApiService } from "@/services/api.service";
import { Absence } from "@/types";
import { QueryKeysService } from "@/services/query-keys.service";
import { calendarLog } from "@/utils/debug.utils";
import { parseDateOnly, WorkScheduleInfo } from "@/utils/day.utils";
import {
  clampPeriod,
  getEmploymentBounds,
  shiftPeriod,
  toCalendarPeriod,
} from "@/utils/month.utils";
import { format, parseISO } from "date-fns";

/** Jak długo wskazany dzień (lista NN / "Dziś") pozostaje podświetlony. */
const FOCUS_HIGHLIGHT_MS = 1500;

interface EmployeeCalendarProps {
  employeeId: string;
  /** Harmonogram pracownika — źródło godzin nominalnych i realnych. */
  schedule: WorkScheduleInfo;
  /** Data zatrudnienia z backendu (ISO) — dolna granica kalendarza. */
  employmentDate: string;
  /** Moment zwolnienia z backendu (ISO) lub null — górna granica kalendarza. */
  firedAt: string | null;
}

export function EmployeeCalendar({
  employeeId,
  schedule,
  employmentDate,
  firedAt,
}: EmployeeCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const hireDate = useMemo(() => parseDateOnly(employmentDate), [employmentDate]);
  // `firedAt` to znacznik czasu (timestamptz), więc parsujemy go w całości —
  // dzień zwolnienia liczymy w strefie lokalnej.
  const firedDate = useMemo(() => (firedAt ? parseISO(firedAt) : null), [firedAt]);
  // Okres zatrudnienia: od miesiąca zatrudnienia (min. styczeń 2026) do miesiąca
  // zwolnienia (bez zwolnienia — grudzień roku bieżący + 5).
  const bounds = useMemo(
    () => getEmploymentBounds(hireDate, firedDate, today),
    [hireDate, firedDate, today],
  );
  // Rok i miesiąc w jednym stanie — zmiana przez granicę roku (grudzień ↔ styczeń)
  // jest atomowa, a szybkie kliknięcia liczą się od najnowszej wartości, nie z domknięcia.
  // Miesiące w zakresie 1-12 (np. styczeń = 1, wrzesień = 9).
  // The displayed month is derived: the requested month clamped to the current
  // `bounds` on every render. When the employment date changes (e.g. moved
  // later after an edit), the view jumps to the first allowed month at once —
  // no effect needed to "fix" stale state.
  const [requestedPeriod, setPeriod] = useState(() => toCalendarPeriod(today));
  const { year, month } = clampPeriod(requestedPeriod, bounds);
  // Dzień wskazany z listy nieobecności NN (czerwony) albo przyciskiem "Dziś"
  // (zielony) — tabela przewija się do niego i chwilowo go podświetla;
  // `requestId` pozwala ponownie wskazać ten sam dzień.
  const [focusedDay, setFocusedDay] = useState<FocusedDay | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    calendarLog("period changed", { employeeId, year, month });
  }, [employeeId, year, month]);

  const {
    data: attendance,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QueryKeysService.attendancePerMonth({
      employeeId,
      year,
      month, // Wędruje wprost 1-12
    }),
    // Parametry czytamy z klucza, a nie z domknięcia — zapytanie zawsze dotyczy
    // dokładnie tego miesiąca, pod którym zostanie zapisane w cache.
    // `signal` anuluje żądanie, gdy użytkownik przejdzie do innego miesiąca.
    queryFn: async ({ queryKey, signal }) => {
      const [, keyEmployeeId, , keyYear, keyMonth] = queryKey;
      calendarLog("request started", {
        employeeId: keyEmployeeId,
        year: keyYear,
        month: keyMonth,
      });

      signal.addEventListener("abort", () =>
        calendarLog("request cancelled", { year: keyYear, month: keyMonth }),
      );

      const absences = await ApiService.getEmployeeAbsencesByMonth(
        keyEmployeeId,
        keyYear,
        keyMonth,
        signal,
      );

      // Odrzucamy rekordy spoza żądanego miesiąca, żeby nie trafiły do złego widoku.
      const monthPrefix = `${keyYear}-${String(keyMonth).padStart(2, "0")}`;
      const items = Array.isArray(absences) ? absences : [];
      const records: CalendarRecord[] = items
        .filter((item: Absence) => item.date?.startsWith(monthPrefix))
        .map((item: Absence) => ({
          date: item.date,
          status: item.type as AttendanceStatus,
        }));

      calendarLog("response received", {
        year: keyYear,
        month: keyMonth,
        received: items.length,
        kept: records.length,
      });

      return records;
    },
    enabled: !!employeeId,
  });

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    attendance?.forEach((record) => {
      if (record.date) {
        map.set(record.date.slice(0, 10), record.status);
      }
    });
    return map;
  }, [attendance]);

  const goToPrevMonth = () => {
    calendarLog("prev month clicked");
    // Shift from the displayed (clamped) month, not a stale out-of-range request.
    setPeriod((prev) => shiftPeriod(clampPeriod(prev, bounds), -1, bounds));
  };

  const goToNextMonth = () => {
    calendarLog("next month clicked");
    setPeriod((prev) => shiftPeriod(clampPeriod(prev, bounds), 1, bounds));
  };

  // Przejście do miesiąca danego dnia, przewinięcie do wiersza i chwilowe
  // podświetlenie w podanym kolorze.
  const focusDay = (date: Date, tone: RowHighlightTone) => {
    setPeriod(clampPeriod(toCalendarPeriod(date), bounds));
    setFocusedDay((prev) => ({
      dateKey: format(date, "yyyy-MM-dd"),
      tone,
      requestId: (prev?.requestId ?? 0) + 1,
    }));

    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    focusTimeoutRef.current = setTimeout(
      () => setFocusedDay(null),
      FOCUS_HIGHLIGHT_MS,
    );
  };

  const handleSelectAbsence = (date: Date) => {
    calendarLog("unexcused absence selected", {
      dateKey: format(date, "yyyy-MM-dd"),
    });
    focusDay(date, "unexcused");
  };

  const goToToday = () => {
    calendarLog("today clicked");
    focusDay(today, "today");
  };

  const handleMonthChange = (nextMonth: number) => {
    calendarLog("month selected", { month: nextMonth });
    setPeriod((prev) =>
      clampPeriod({ ...clampPeriod(prev, bounds), month: nextMonth }, bounds),
    );
  };

  // Po zmianie roku na rok zatrudnienia/zwolnienia miesiąc spoza okresu
  // zatrudnienia zostaje przesunięty na najbliższy dozwolony.
  const handleYearChange = (nextYear: number) => {
    calendarLog("year selected", { year: nextYear });
    setPeriod((prev) =>
      clampPeriod({ ...clampPeriod(prev, bounds), year: nextYear }, bounds),
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <DateControls
          month={month}
          year={year}
          bounds={bounds}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
        />
        <UnexcusedAbsencesBell
          employeeId={employeeId}
          hireDate={hireDate}
          onSelectDate={handleSelectAbsence}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-1 min-h-0 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Ładowanie kalendarza...
        </div>
      ) : isError ? (
        <SectionErrorBlock
          title="Błąd kalendarza pracownika"
          description={error?.message || "Nie udało się załadować kalendarza."}
          onRetry={() => refetch()}
        />
      ) : (
        <CalendarTable
          employeeId={employeeId}
          year={year}
          month={month} // Przekazujemy czyste 1-12
          attendanceByDate={attendanceByDate}
          schedule={schedule}
          hireDate={hireDate}
          firedDate={firedDate}
          focusedDay={focusedDay}
        />
      )}
    </div>
  );
}
