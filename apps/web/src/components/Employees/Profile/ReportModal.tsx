"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateControls } from "../Calendar/DateControls";
import { ApiService } from "@/services/api.service";
import { downloadBlob } from "@/utils/download.utils";
import { parseDateOnly } from "@/utils/day.utils";
import {
  CalendarPeriod,
  clampPeriod,
  getReportBounds,
  shiftPeriod,
} from "@/utils/month.utils";

interface ReportModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Data zatrudnienia z backendu (ISO) — najwcześniejszy miesiąc raportu. */
  employmentDate: string;
  /** Moment zwolnienia z backendu (ISO) lub null — najpóźniejszy miesiąc raportu. */
  firedAt: string | null;
}

export function ReportModal({
  employeeId,
  isOpen,
  onClose,
  employmentDate,
  firedAt,
}: ReportModalProps) {
  // Liczony przy każdym renderze (tanie) — po przełomie miesiąca zakres od razu
  // obejmuje kolejny zamknięty miesiąc. `firedAt` to timestamptz, więc
  // parsujemy go w całości (jak w EmployeeCalendar).
  const bounds = getReportBounds(
    parseDateOnly(employmentDate),
    firedAt ? parseISO(firedAt) : null,
  );

  // Domyślnie ostatni dostępny miesiąc; wyświetlany okres zawsze przycięty do
  // `bounds` (jak w EmployeeCalendar), więc nieaktualny wybór nie wyjdzie poza zakres.
  const [requestedPeriod, setPeriod] = useState<CalendarPeriod | null>(null);
  const period = bounds
    ? clampPeriod(requestedPeriod ?? bounds.max, bounds)
    : null;

  const reportMutation = useMutation({
    mutationFn: ({ year, month }: CalendarPeriod) =>
      ApiService.getEmployeeMonthlyReport(employeeId, year, month),
    onSuccess: ({ blob, fileName }) => {
      downloadBlob(blob, fileName);
      toast.success("Raport został wygenerowany");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Nie udało się wygenerować raportu");
    },
  });

  // Podczas generowania modal nie daje się zamknąć — jak w ConfirmModal.
  const handleOpenChange = (open: boolean) => {
    if (!open && !reportMutation.isPending) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-zinc-900 border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-left text-xl font-semibold tracking-wide">
            Generowanie raportu
          </DialogTitle>
        </DialogHeader>

        {bounds && period ? (
          <div className="py-2">
            <DateControls
              month={period.month}
              year={period.year}
              bounds={bounds}
              onMonthChange={(month) =>
                setPeriod(clampPeriod({ ...period, month }, bounds))
              }
              onYearChange={(year) =>
                setPeriod(clampPeriod({ ...period, year }, bounds))
              }
              onPrevMonth={() => setPeriod(shiftPeriod(period, -1, bounds))}
              onNextMonth={() => setPeriod(shiftPeriod(period, 1, bounds))}
              showTodayButton={false}
            />
          </div>
        ) : (
          <DialogDescription className="py-2 text-zinc-600">
            Brak zamkniętych miesięcy — raport będzie dostępny po zakończeniu
            pierwszego miesiąca zatrudnienia.
          </DialogDescription>
        )}

        <DialogFooter>
          <Button
            onClick={() => period && reportMutation.mutate(period)}
            disabled={!period || reportMutation.isPending}
          >
            {reportMutation.isPending && <Spinner />}
            Generuj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
