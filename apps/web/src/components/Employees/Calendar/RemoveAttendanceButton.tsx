"use client";

import { format } from "date-fns";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ApiService } from "@/services/api.service";
import { AttendanceStatus } from "@/utils/calendar.types";
import { refreshAttendanceCaches } from "@/utils/attendance-cache.utils";

interface RemoveAttendanceButtonProps {
  employeeId: string;
  date: Date;
  currentStatus: AttendanceStatus;
  disabled?: boolean;
  onRemoved: () => void;
}

/**
 * Przywraca dzień do obecności (OB) — backend usuwa wtedy wpis absencji.
 * Mutacja i odświeżenie cache są tutaj, a nie w rodzicu.
 */
export function RemoveAttendanceButton({
  employeeId,
  date,
  currentStatus,
  disabled = false,
  onRemoved,
}: RemoveAttendanceButtonProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      ApiService.updateEmployeeAttendance(employeeId, {
        status: AttendanceStatus.PRESENCE,
        date: format(date, "yyyy-MM-dd"),
      }),
    onSuccess: async () => {
      await refreshAttendanceCaches(queryClient, {
        employeeId,
        date,
        previousStatus: currentStatus,
        newStatus: AttendanceStatus.PRESENCE,
      });
      onRemoved();
    },
    onError: (error) => {
      console.error("Błąd podczas usuwania frekwencji:", error);
      toast.error(error.message || "Nie udało się usunąć frekwencji.");
    },
  });

  const handleClick = () => mutation.mutate();

  return (
    <Button
      type="button"
      variant="outline-primary"
      onClick={handleClick}
      disabled={disabled || mutation.isPending}
      className="w-full"
    >
      {mutation.isPending ? "Usuwanie…" : "Usuń frekwencję"}
    </Button>
  );
}
