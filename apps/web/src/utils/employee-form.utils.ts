import { format } from "date-fns";
import type { FormState } from "react-hook-form";
import type { EmployeeFormValues } from "@/components/EmployeeModal/employee.schema";
import { ContractType, Employee, Location, UpdateEmployeeDto } from "@/types";
import { formatScheduleTime, parseDateOnly } from "@/utils/day.utils";

/** Pola zmienione przez użytkownika (react-hook-form `formState.dirtyFields`). */
export type EmployeeDirtyFields = FormState<EmployeeFormValues>["dirtyFields"];

/** Pełny `Employee` z cache React Query → płaskie wartości formularza. */
export const employeeToFormValues = (
  employee: Employee,
): EmployeeFormValues => ({
  name: employee.name,
  surname: employee.surname,
  pesel: employee.pesel,
  position: employee.position,
  location: employee.location as Location,
  // Brak relacji → puste pole; walidacja "Wybierz firmę" wymusi wybór.
  company: employee.company?.id ?? "",
  workHours: employee.workHours,
  // Backend zwraca "HH:mm:ss", a pola formularza (StartSelect) używają "HH:mm".
  workSchedule: {
    start: formatScheduleTime(employee.workSchedule.start),
    end: formatScheduleTime(employee.workSchedule.end),
  },
  employmentDate: format(parseDateOnly(employee.employmentDate), "yyyy-MM-dd"),
  contractType: employee.contractType as ContractType,
  leave: employee.leave.base === 26 ? 26 : 20,
});

/**
 * Applies a saved update to the cached `Employee` (from GET), so every view —
 * incl. the attendance calendar's employment bounds — re-renders immediately,
 * before the refetch. Relations (`company`, `leave`) differ in shape between the
 * DTO and the entity, so they are left for the refetch to fill in.
 */
export const applyEmployeeUpdate = (
  employee: Employee,
  dto: UpdateEmployeeDto,
): Employee => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { company, leave, ...plainFieldChanges } = dto;
  return { ...employee, ...plainFieldChanges };
};

/**
 * DTO dla `PUT /api/employees/{id}` — tylko pola zmienione w formularzu.
 * Etat i harmonogram wysyłamy razem, bo koniec pracy wynika z obu wartości.
 */
export const buildEmployeeUpdateDto = (
  values: EmployeeFormValues,
  dirtyFields: EmployeeDirtyFields,
): UpdateEmployeeDto => {
  const dto: UpdateEmployeeDto = {};

  if (dirtyFields.name) dto.name = values.name;
  if (dirtyFields.surname) dto.surname = values.surname;
  if (dirtyFields.pesel) dto.pesel = values.pesel;
  if (dirtyFields.position) dto.position = values.position;
  if (dirtyFields.location) dto.location = values.location;
  if (dirtyFields.company) dto.company = values.company;
  if (dirtyFields.leave) dto.leave = values.leave;
  if (dirtyFields.employmentDate) dto.employmentDate = values.employmentDate;
  if (dirtyFields.contractType) dto.contractType = values.contractType;

  if (dirtyFields.workHours || dirtyFields.workSchedule) {
    dto.workHours = values.workHours;
    dto.workSchedule = values.workSchedule;
  }

  return dto;
};
