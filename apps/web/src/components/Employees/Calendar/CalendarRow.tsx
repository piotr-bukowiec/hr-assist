"use client";

import { Ref, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import { TableCell, TableRow } from "@/components/ui/table";
import { StatusIndicator } from "./StatusIndicator";
import { Badge } from "@/components/ui/badge";
import { AttendanceStatus } from "@/utils/calendar.types";
import { cn } from "@/lib/utils";
import { AttendanceModal } from "./AttendanceModal";
import { TodayMarker } from "./TodayMarker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiService } from "@/services/api.service";
import { refreshAttendanceCaches } from "@/utils/attendance-cache.utils";
import {
  CalendarDayState,
  formatScheduleTime,
  WorkScheduleInfo,
} from "@/utils/day.utils";

/** Kolor chwilowego podświetlenia wiersza po przewinięciu do niego. */
export type RowHighlightTone = "unexcused" | "today";

// Czerwone — dzień z listy nieobecności NN, zielone — przycisk "Dziś".
// `animate-none` wyłącza pulsowanie wiersza NN na czas podświetlenia.
const HIGHLIGHT_CLASSES: Record<RowHighlightTone, string> = {
  unexcused: "animate-none bg-destructive/15 ring-2 ring-destructive/60 ring-inset",
  today: "animate-none bg-primary/15 ring-2 ring-primary/60 ring-inset",
};

interface CalendarRowProps {
  ref?: Ref<HTMLTableRowElement>;
  employeeId: string;
  date: Date;
  isToday: boolean;
  holidayName: string | null;
  dayState: CalendarDayState;
  schedule: WorkScheduleInfo;
  /**
   * Zwolniony pracownik — każdy dzień otwiera modal tylko do odczytu, a zapis
   * frekwencji jest niedostępny.
   */
  isReadOnly?: boolean;
  /** Chwilowe podświetlenie (wybór z listy NN albo "Dziś"); null — brak. */
  highlightTone?: RowHighlightTone | null;
}

interface AttendanceChange {
  newStatus: AttendanceStatus;
  previousStatus: AttendanceStatus | null;
}

export function CalendarRow({
  ref,
  employeeId,
  date,
  isToday,
  holidayName,
  dayState,
  schedule,
  isReadOnly = false,
  highlightTone = null,
}: CalendarRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const weekdayLabel = format(date, "EEEE", { locale: pl });

  // Stan dnia (blokada, status, godziny) wylicza `describeCalendarDay` —
  // te same wartości trafiają do sumy miesiąca w stopce tabeli.
  const {
    isFuture,
    isLocked,
    status: effectiveStatus,
    nominalHours,
    realHours,
  } = dayState;

  const isUnexcused = effectiveStatus === AttendanceStatus.UNEXCUSED_ABSENCE;
  // U zwolnionego pracownika podgląd dnia jest dostępny zawsze, edycja nigdy.
  const canOpenModal = isReadOnly || !isLocked;

  const mutation = useMutation({
    mutationFn: async ({ newStatus }: AttendanceChange) => {
      if (!employeeId) throw new Error("Brak ID pracownika w URL");
      const dateString: string = format(date, "yyyy-MM-dd");
      await ApiService.updateEmployeeAttendance(employeeId, {
        status: newStatus,
        date: dateString,
      });
    },
    onSuccess: async (_data, { newStatus, previousStatus }) => {
      await refreshAttendanceCaches(queryClient, {
        employeeId,
        date,
        previousStatus,
        newStatus,
      });

      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error("Błąd podczas aktualizacji frekwencji:", error);
      // Np. przekroczony limit urlopu przy planowaniu (422 z backendu).
      toast.error(error.message || "Nie udało się zapisać statusu.");
    },
  });

  const handleRowClick = () => {
    if (!canOpenModal) return;
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus: AttendanceStatus) => {
    await mutation.mutateAsync({ newStatus, previousStatus: effectiveStatus });
  };

  return (
    <>
      <TableRow
        ref={ref}
        // Po tym atrybucie tabela znajduje wiersz, do którego ma przewinąć.
        data-date-key={format(date, "yyyy-MM-dd")}
        onClick={handleRowClick}
        className={cn(
          // Tło i obramowanie (ring = box-shadow) wygasają płynnie po zdjęciu podświetlenia.
          "transition-[background-color,box-shadow] duration-500",
          isLocked && "opacity-60 bg-muted/20",
          canOpenModal
            ? "cursor-pointer hover:bg-muted/40"
            : "cursor-not-allowed",
          isToday && "bg-muted/50 font-medium",
          isUnexcused && "bg-destructive/15 animate-pulse",
          highlightTone && HIGHLIGHT_CLASSES[highlightTone],
        )}
      >
        {/* `relative group` jest wymagane przez TodayMarker (pozycjonowanie + rozwinięcie na hover) */}
        <TableCell className={cn("font-medium", isToday && "relative group")}>
          {isToday && <TodayMarker isFlashing={highlightTone === "today"} />}
          {format(date, "d MMMM yyyy", { locale: pl })}
        </TableCell>
        <TableCell className="capitalize text-muted-foreground">
          {weekdayLabel}
        </TableCell>
        <TableCell>
          {holidayName ? (
            <Badge variant="info" title="Święto ustawowo wolne">
              ŚUW
            </Badge>
          ) : (
            <StatusIndicator status={effectiveStatus} />
          )}
        </TableCell>

        {holidayName ? (
          <TableCell
            colSpan={3}
            className="text-center font-medium text-muted-foreground bg-muted/10 italic"
          >
            {holidayName}
          </TableCell>
        ) : (
          <>
            <TableCell className="text-muted-foreground">
              {/* Przedział pracy dla każdego dnia roboczego — dni wolne to "—" */}
              {nominalHours === null
                ? "—"
                : `${formatScheduleTime(schedule.start)} - ${formatScheduleTime(schedule.end)}`}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {nominalHours === null ? "—" : `${nominalHours}h`}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {realHours === null ? "—" : `${realHours}h`}
            </TableCell>
          </>
        )}
      </TableRow>

      {canOpenModal && (
        <AttendanceModal
          // Remount po zmianie statusu — wybór w modalu startuje od aktualnej wartości.
          key={effectiveStatus ?? "pause"}
          isOpen={isModalOpen}
          onClose={() => {
            if (!mutation.isPending) setIsModalOpen(false);
          }}
          date={date}
          employeeId={employeeId}
          currentStatus={effectiveStatus}
          isFuture={isFuture}
          isReadOnly={isReadOnly}
          onUpdate={handleUpdateStatus}
        />
      )}
    </>
  );
}
