"use client";

import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RemoveAttendanceButton } from "./RemoveAttendanceButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AttendanceStatus,
  ORDERED_ATTENDANCE_STATUSES,
  STATUS_PRESENTATION,
} from "@/utils/calendar.types";

const STATUS_SELECT_ID = "attendance-status";

interface AttendanceModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  currentStatus: AttendanceStatus | null;
  /** Dzień przyszły — planowanie zamiast ewidencji. */
  isFuture: boolean;
  /** Zwolniony pracownik — pola są zablokowane, a przyciski zapisu ukryte. */
  isReadOnly?: boolean;
  onUpdate: (status: AttendanceStatus) => Promise<void>;
}

// Nieobecności nieusprawiedliwionej nie da się zaplanować z wyprzedzeniem.
const FUTURE_STATUS_OPTIONS = ORDERED_ATTENDANCE_STATUSES.filter(
  (status) => status !== AttendanceStatus.UNEXCUSED_ABSENCE,
);

// W przyszłości OB oznacza "brak planu" — backend usuwa wtedy wpis i dzień
// wraca do stanu "Pauza".
const getOptionLabel = (
  status: AttendanceStatus,
  isFuture: boolean,
): string => {
  if (isFuture && status === AttendanceStatus.PRESENCE)
    return "Pauza (brak planu)";

  const presentation = STATUS_PRESENTATION[status];
  return `${presentation.label} (${presentation.code})`;
};

export function AttendanceModal({
  employeeId,
  isOpen,
  onClose,
  date,
  currentStatus,
  isFuture,
  isReadOnly = false,
  onUpdate,
}: AttendanceModalProps) {
  const statusOptions = isFuture
    ? FUTURE_STATUS_OPTIONS
    : ORDERED_ATTENDANCE_STATUSES;

  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(
    currentStatus ?? AttendanceStatus.PRESENCE,
  );
  const [isSaving, setIsSaving] = useState(false);

  const formattedDate = format(date, "d MMMM yyyy", { locale: pl });

  const handleSave = async () => {
    if (isReadOnly) return;
    setIsSaving(true);
    try {
      await onUpdate(selectedStatus);
    } catch {
      // Błąd jest już logowany przez mutację wywołującą onUpdate —
      // zostawiamy modal otwarty, żeby użytkownik mógł spróbować ponownie.
      setIsSaving(false);
      return;
    }

    // Odświeżenie cache (kalendarz, urlopy, pracownik) robi mutacja w CalendarRow.
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white text-zinc-900 border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-wide text-center">
            {isReadOnly
              ? "Podgląd frekwencji"
              : isFuture
                ? "Planowanie frekwencji"
                : "Zmiana frekwencji"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <DialogDescription className="text-center font-medium">
            {formattedDate}
          </DialogDescription>

          {isReadOnly && (
            <p
              role="status"
              className="rounded-md border border-border bg-muted px-3 py-2 text-center text-sm text-muted-foreground"
            >
              Pracownik jest zwolniony — edycja frekwencji jest zablokowana.
            </p>
          )}

          {/* Pole wyboru i przyciski w jednej kolumnie z jednym odstępem (gap-3) —
              układ jest równy niezależnie od tego, czy "Usuń frekwencję" jest widoczne */}
          <div className="flex w-full flex-col gap-3">
            {/* gap zamiast space-y: Base UI Select renderuje ukryty <input> za
                triggerem, więc space-y (Tailwind v4 — margines pod każdym dzieckiem
                poza ostatnim) dodawał 8px pod polem wyboru */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor={STATUS_SELECT_ID}
                className="text-xs text-muted-foreground"
              >
                Status obecności
              </Label>
              <Select
                disabled={isReadOnly}
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as AttendanceStatus)
                }
              >
                <SelectTrigger
                  id={STATUS_SELECT_ID}
                  className="w-full"
                  disabled={isReadOnly}
                >
                  <SelectValue>
                    {/* Dzień bez statusu (wolny, poza zatrudnieniem) — w podglądzie "—" */}
                    {isReadOnly && currentStatus === null
                      ? "—"
                      : getOptionLabel(selectedStatus, isFuture)}
                  </SelectValue>
                </SelectTrigger>
                {/* Lista rozwija się pod triggerem (jego szerokość), a przy wielu
                  opcjach przewija się w pionie zamiast wychodzić poza modal */}
                <SelectContent
                  alignItemWithTrigger={false}
                  align="start"
                  className="max-h-72 overflow-y-auto"
                >
                  {statusOptions.map((statusOption) => (
                    <SelectItem key={statusOption} value={statusOption}>
                      {getOptionLabel(statusOption, isFuture)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tylko gdy dzień ma zapisany status inny niż obecność */}
            {!isReadOnly &&
              currentStatus !== null &&
              currentStatus !== AttendanceStatus.PRESENCE && (
                <RemoveAttendanceButton
                  employeeId={employeeId}
                  date={date}
                  currentStatus={currentStatus}
                  disabled={isSaving}
                  onRemoved={onClose}
                />
              )}
            {!isReadOnly && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? "Zapisywanie…" : "Zaktualizuj"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
