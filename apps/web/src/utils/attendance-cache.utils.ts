import { QueryClient } from "@tanstack/react-query";
import { QueryKeysService } from "@/services/query-keys.service";
import { Employee, EmployeesList } from "@/types";
import {
  AttendanceStatus,
  LEAVE_ATTENDANCE_STATUSES,
} from "@/utils/calendar.types";
import { toCalendarPeriod } from "@/utils/month.utils";

interface AttendanceChangeContext {
  employeeId: string;
  date: Date;
  previousStatus: AttendanceStatus | null;
  newStatus: AttendanceStatus;
}

const isLeaveStatus = (status: AttendanceStatus | null): boolean =>
  status !== null && LEAVE_ATTENDANCE_STATUSES.includes(status);

/**
 * Odświeża cache po zmianie frekwencji jednego dnia — wspólne dla zmiany
 * statusu w modalu i przycisku "Usuń frekwencję".
 */
export const refreshAttendanceCaches = async (
  queryClient: QueryClient,
  { employeeId, date, previousStatus, newStatus }: AttendanceChangeContext,
): Promise<void> => {
  const { year, month } = toCalendarPeriod(date);

  // Urlop mógł zostać dodany (nowy status to urlop) albo usunięty
  // (np. UW → OB, backend kasuje wtedy absencję) — w obu przypadkach
  // zmienia się pula dni urlopowych.
  const affectsLeave =
    isLeaveStatus(newStatus) || isLeaveStatus(previousStatus);

  // 1. Inwalidujemy absencje w kalendarzu dla danego miesiąca, roczną listę
  //    absencji (dzwonek NN), dane o urlopach (jeśli dotyczy) i odświeżamy
  //    szczegóły pracownika
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: QueryKeysService.attendancePerMonth({
        employeeId,
        year,
        month,
      }),
    }),
    queryClient.invalidateQueries({
      queryKey: QueryKeysService.absencesPerYear({ employeeId, year }),
    }),
    affectsLeave
      ? queryClient.invalidateQueries({
          queryKey: QueryKeysService.employeeLeave({ employeeId }),
        })
      : Promise.resolve(),
    queryClient.refetchQueries({
      queryKey: QueryKeysService.employeeDetails({ employeeId }),
    }),
  ]);

  // 2. Pobieramy świeży obiekt z cache szczegółów pracownika
  const updatedEmployee = queryClient.getQueryData<Employee>(
    QueryKeysService.employeeDetails({ employeeId }),
  );

  // 3. Podmieniamy go na liście głównej bez ponownego pobierania całej listy!
  queryClient.setQueryData(
    QueryKeysService.employeesList(),
    (oldData: EmployeesList | undefined) => {
      if (!oldData) return oldData;

      const list = Array.isArray(oldData)
        ? oldData
        : (oldData as EmployeesList);
      if (!Array.isArray(list)) return oldData;

      // Jeśli z jakiegoś powodu nie mamy nowego obiektu, zostawiamy stare dane
      if (!updatedEmployee) return oldData;

      const updatedList = list.map((emp: Employee) => {
        if (emp.id === employeeId) {
          return updatedEmployee; // <-- Wrzucamy świeży obiekt z backendu!
        }
        return emp;
      });

      return Array.isArray(oldData)
        ? updatedList
        : { ...(oldData as EmployeesList), employees: updatedList };
    },
  );
};
