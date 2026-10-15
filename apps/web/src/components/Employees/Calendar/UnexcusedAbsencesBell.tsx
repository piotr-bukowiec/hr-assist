"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, getYear } from "date-fns";
import { pl } from "date-fns/locale";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ApiService } from "@/services/api.service";
import { QueryKeysService } from "@/services/query-keys.service";
import { Absences } from "@/types";
import { AttendanceStatus } from "@/utils/calendar.types";
import { parseDateOnly } from "@/utils/day.utils";

interface UnexcusedAbsence {
  dateKey: string; // yyyy-MM-dd
  date: Date;
}

interface UnexcusedAbsencesBellProps {
  employeeId: string;
  /** Employment start — absences dated before it are outside the tenure and hidden. */
  hireDate: Date | null;
  /** Wybór dnia z listy — kalendarz przechodzi do niego i go podświetla. */
  onSelectDate: (date: Date) => void;
}

/** Tylko nieobecności NN, od najstarszej do najnowszej. */
const selectUnexcusedAbsences = (absences: Absences): UnexcusedAbsence[] =>
  (Array.isArray(absences) ? absences : [])
    .filter(
      (absence) =>
        (absence.type as AttendanceStatus) ===
        AttendanceStatus.UNEXCUSED_ABSENCE,
    )
    .map((absence) => ({
      dateKey: absence.date.slice(0, 10),
      date: parseDateOnly(absence.date),
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

export function UnexcusedAbsencesBell({
  employeeId,
  hireDate,
  onSelectDate,
}: UnexcusedAbsencesBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const year = getYear(new Date());

  // Klucz ['absences', employeeId, year] — inwalidowany przez
  // `refreshAttendanceCaches` po każdej zmianie frekwencji, więc lista
  // aktualizuje się od razu po usprawiedliwieniu dnia.
  const { data: allUnexcusedAbsences } = useQuery({
    queryKey: QueryKeysService.absencesPerYear({ employeeId, year }),
    queryFn: ({ signal }) =>
      ApiService.getEmployeeAbsencesByYear(employeeId, year, signal),
    select: selectUnexcusedAbsences,
    enabled: !!employeeId,
  });

  // The employment date is the tracking boundary: entries before it (e.g. left
  // over after the date was moved later) are not listed — their calendar days
  // are locked and could not be edited anyway.
  const unexcusedAbsences = useMemo(() => {
    const absences = allUnexcusedAbsences ?? [];
    if (!hireDate) return absences;
    const hireDateKey = format(hireDate, "yyyy-MM-dd");
    return absences.filter(({ dateKey }) => dateKey >= hireDateKey);
  }, [allUnexcusedAbsences, hireDate]);

  const hasAbsences = unexcusedAbsences.length > 0;

  return (
    // Wybór daty NIE zamyka popupu — można przeklikać kolejne nieobecności.
    // Zamyka go kliknięcie poza nim, ponowne kliknięcie dzwonka albo opróżnienie
    // listy (np. po usprawiedliwieniu ostatniego dnia).
    <Popover open={isOpen && hasAbsences} onOpenChange={setIsOpen}>
      <PopoverTrigger
        disabled={!hasAbsences}
        aria-label={
          hasAbsences
            ? `Nieobecności nieusprawiedliwione: ${unexcusedAbsences.length}`
            : "Brak nieobecności nieusprawiedliwionych"
        }
        render={
          <Button
            variant="outline"
            className={cn(
              hasAbsences
                ? "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive aria-expanded:bg-destructive/10 aria-expanded:text-destructive"
                : "text-muted-foreground",
            )}
          />
        }
      >
        <Bell
          className={cn(
            "origin-top",
            hasAbsences && "motion-safe:animate-bell-ring",
          )}
        />
        {hasAbsences && (
          <span className="tabular-nums">{unexcusedAbsences.length}</span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end">
        {/* Nagłówek w stylu tytułów modali (np. "Zmiana frekwencji"), oddzielony od listy */}
        <PopoverHeader>
          <PopoverTitle className="text-center text-base font-semibold tracking-wide">
            Nieobecności nieusprawiedliwione
          </PopoverTitle>
        </PopoverHeader>
        <Separator />
        {/* ~5 pozycji widocznych, reszta przewijana */}
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto overscroll-y-contain">
          {unexcusedAbsences.map(({ dateKey, date }) => (
            <li key={dateKey}>
              {/* Daty do lewej i na czerwono — spójnie ze statusem NN i dzwonkiem */}
              <Button
                variant="ghost"
                className="w-full justify-start px-3 text-left text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onSelectDate(date)}
              >
                {format(date, "d MMMM yyyy", { locale: pl })}
              </Button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
