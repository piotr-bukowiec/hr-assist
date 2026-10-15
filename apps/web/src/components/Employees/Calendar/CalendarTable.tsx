"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfToday,
} from "date-fns";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarRow, RowHighlightTone } from "./CalendarRow";
import { AttendanceStatus } from "@/utils/calendar.types";
import { useHolidays } from "@/hooks/use-holidays";
import { polishName } from "@/app/(dashboard)/holidays/holidays-translations";
import { calendarLog } from "@/utils/debug.utils";
import { periodStartDate } from "@/utils/month.utils";
import {
  CalendarDayState,
  describeCalendarDay,
  WorkScheduleInfo,
} from "@/utils/day.utils";

const COLUMNS = [
  "Data",
  "Dzień tygodnia",
  "Status",
  "Przedział pracy",
  "Godziny nominalne",
  "Godziny realne",
] as const;

const COLUMN_WIDTHS = [
  "w-[18%]",
  "w-[14%]",
  "w-[14%]",
  "w-[22%]",
  "w-[16%]",
  "w-[16%]",
];

// Ten sam <colgroup> w tabeli nagłówka, dni i stopki — przy `table-fixed`
// gwarantuje identyczne szerokości kolumn we wszystkich trzech częściach.
const COLUMN_GROUP = (
  <colgroup>
    {COLUMN_WIDTHS.map((width, index) => (
      <col key={index} className={width} />
    ))}
  </colgroup>
);

// Nagłówek i stopka rezerwują to samo miejsce na pasek przewijania co lista
// dni, więc kolumny nie rozjeżdżają się, gdy pasek się pojawia.
const SCROLLBAR_GUTTER_CLASS = "[scrollbar-gutter:stable]";
const FIXED_SECTION_CLASS = cn(
  "shrink-0 overflow-hidden",
  SCROLLBAR_GUTTER_CLASS,
);

interface CalendarTableProps {
  employeeId: string;
  year: number;
  month: number; // oczekiwane 1-12
  attendanceByDate: Map<string, AttendanceStatus>;
  schedule: WorkScheduleInfo;
  /** Dni przed tą datą są zablokowane i puste ("—"). */
  hireDate: Date | null;
  /**
   * Moment zwolnienia — dni po nim są puste ("—"), a cały kalendarz tylko do
   * odczytu (kliknięcie dnia otwiera modal bez możliwości zapisu).
   */
  firedDate: Date | null;
  /**
   * Dzień, do którego przewijamy i który chwilowo podświetlamy (wybór z listy
   * nieobecności NN albo przycisk "Dziś").
   */
  focusedDay: FocusedDay | null;
}

export interface FocusedDay {
  dateKey: string; // yyyy-MM-dd
  tone: RowHighlightTone;
  /** Rośnie przy każdym wyborze — ponowny wybór tego samego dnia też przewija. */
  requestId: number;
}

interface CalendarDayEntry {
  date: Date;
  dateKey: string;
  holidayName: string | null;
  state: CalendarDayState;
}

interface MonthHoursTotals {
  nominal: number;
  /** null — żaden dzień nie ma jeszcze godzin realnych (np. przyszły miesiąc). */
  real: number | null;
}

/** Suma godzin miesiąca — liczona z tych samych stanów dni, które widać w wierszach. */
const sumMonthHours = (entries: CalendarDayEntry[]): MonthHoursTotals =>
  entries.reduce<MonthHoursTotals>(
    (totals, { state }) => ({
      nominal: totals.nominal + (state.nominalHours ?? 0),
      real:
        state.realHours === null
          ? totals.real
          : (totals.real ?? 0) + state.realHours,
    }),
    { nominal: 0, real: null },
  );

export function CalendarTable({
  employeeId,
  year,
  month,
  attendanceByDate,
  schedule,
  hireDate,
  firedDate,
  focusedDay,
}: CalendarTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRowRef = useRef<HTMLTableRowElement>(null);

  const { data: holidays = [] } = useHolidays();

  const holidaysMap = useMemo(() => {
    const map = new Map<string, string>();
    holidays.forEach((h) => {
      map.set(h.date, polishName(h.name));
    });
    return map;
  }, [holidays]);

  const monthStart = useMemo(
    () => periodStartDate({ year, month }),
    [year, month],
  );

  const today = useMemo(() => startOfToday(), []);
  const isCurrentMonth = isSameMonth(monthStart, today);

  const entries = useMemo<CalendarDayEntry[]>(
    () =>
      eachDayOfInterval({ start: monthStart, end: endOfMonth(monthStart) }).map(
        (date) => {
          const dateKey = format(date, "yyyy-MM-dd");
          const holidayName = holidaysMap.get(dateKey) ?? null;
          const state = describeCalendarDay({
            date,
            today,
            rawStatus: attendanceByDate.get(dateKey),
            holidayName,
            workHours: schedule.workHours,
            hireDate,
            firedDate,
          });

          return {
            date,
            dateKey,
            // Święto poza okresem zatrudnienia też jest tylko "—" — bez ŚUW i nazwy.
            holidayName: state.kind === "holiday" ? holidayName : null,
            state,
          };
        },
      ),
    [
      monthStart,
      holidaysMap,
      today,
      attendanceByDate,
      schedule.workHours,
      hireDate,
      firedDate,
    ],
  );

  const totals = useMemo(() => sumMonthHours(entries), [entries]);

  useEffect(() => {
    calendarLog("table rendered", {
      year,
      month,
      firstDay: format(monthStart, "yyyy-MM-dd"),
      days: entries.length,
      records: attendanceByDate.size,
      nominalHours: totals.nominal,
      realHours: totals.real,
    });
  }, [year, month, monthStart, entries, attendanceByDate, totals]);

  // Po otwarciu bieżącego miesiąca pokazujemy dzisiejszy wiersz.
  useLayoutEffect(() => {
    if (!isCurrentMonth) return;

    todayRowRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [isCurrentMonth, monthStart]);

  // Przewinięcie do wskazanego dnia (lista NN / "Dziś"). useEffect uruchamia się
  // po useLayoutEffect powyżej, więc przy montażu tabeli wygrywa wskazany dzień.
  useEffect(() => {
    if (!focusedDay) return;

    scrollContainerRef.current
      ?.querySelector<HTMLTableRowElement>(
        `[data-date-key="${focusedDay.dateKey}"]`,
      )
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusedDay]);

  // Trzy osobne tabele: nagłówek i stopka są poza obszarem przewijania, więc
  // scroll (kółko, pasek) działa wyłącznie na wierszach dni. Wspólny <colgroup>
  // i ta sama rezerwa na pasek przewijania trzymają kolumny w jednej linii.
  return (
    // gap-0: Card ma domyślnie gap-(--card-spacing) — przy trzech sekcjach
    // (nagłówek, dni, stopka) dawało to pusty pas nad pierwszym i pod ostatnim wierszem.
    <Card className="flex flex-1 min-h-0 flex-col gap-0 overflow-hidden border border-border p-0 shadow-sm">
      <div className={FIXED_SECTION_CLASS}>
        <Table>
          {COLUMN_GROUP}
          <TableHeader>
            <TableRow>
              {COLUMNS.map((label) => (
                <TableHead key={label}>{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      <div
        ref={scrollContainerRef}
        // overscroll-y-none — bez "gumowego" odbicia na granicach listy.
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-y-none",
          SCROLLBAR_GUTTER_CLASS,
        )}
      >
        <Table>
          {COLUMN_GROUP}
          <TableBody>
            {entries.map(({ date, dateKey, holidayName, state }) => {
              const isToday = isSameDay(date, today);

              return (
                <CalendarRow
                  key={dateKey}
                  ref={isToday ? todayRowRef : undefined}
                  employeeId={employeeId}
                  date={date}
                  isToday={isToday}
                  holidayName={holidayName}
                  dayState={state}
                  schedule={schedule}
                  isReadOnly={firedDate !== null}
                  highlightTone={
                    focusedDay?.dateKey === dateKey ? focusedDay.tone : null
                  }
                />
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className={cn(FIXED_SECTION_CLASS, "border-t border-border")}>
        <Table>
          {COLUMN_GROUP}
          <TableFooter className="border-t-0 bg-muted">
            {/* Jedna komórka na kolumnę — etykieta dokładnie pod kolumną "Data" */}
            <TableRow className="hover:bg-transparent">
              <TableCell className="font-bold uppercase tracking-wide">
                Suma miesiąca
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell
                className="font-bold"
                title="Wszystkie dni robocze miesiąca według harmonogramu (bez weekendów i świąt)"
              >
                {totals.nominal}h
              </TableCell>
              <TableCell
                className="font-bold"
                title="Tylko dni obecności (OB) do dziś — urlopy, L4 i inne nieobecności liczą się jako 0h; „—”, dopóki żaden dzień nie ma godzin realnych"
              >
                {totals.real === null ? "—" : `${totals.real}h`}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Card>
  );
}
