"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  DialogContent,
  DialogHeader,
  Dialog,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiService } from "@/services/api.service";
import { QueryKeysService } from "@/services/query-keys.service";
import { Employee, UpdateEmployeeDto } from "@/types";
import {
  applyEmployeeUpdate,
  buildEmployeeUpdateDto,
  EmployeeDirtyFields,
  employeeToFormValues,
} from "@/utils/employee-form.utils";
import { ConfirmModal } from "../../ConfirmModal/ConfirmModal";
import { Form } from "../Form/Form";
import { FormHandle } from "../Form/Form.types";
import {
  EditedEmployeeContext,
  EmployeeFormValues,
  getDefaultEmployeeFormValues,
  LAST_EMPLOYEE_DEFAULTS_QUERY_KEY,
  pickRememberedFields,
  RememberedEmployeeFields,
} from "../employee.schema";

interface BaseEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Tryb edycji wymaga pełnego `employee` (z cache) — wymusza to TypeScript. */
type EmployeeModalProps =
  | (BaseEmployeeModalProps & { mode: "create" })
  | (BaseEmployeeModalProps & { mode: "edit"; employee: Employee });

type PendingSubmission =
  | { mode: "create"; values: EmployeeFormValues }
  | { mode: "edit"; employeeId: string; dto: UpdateEmployeeDto };

const MODE_TEXT = {
  create: {
    title: "Dodawanie pracownika",
    submitLabel: "Dodaj",
    confirmMessage: "Czy na pewno chcesz dodać tego pracownika do systemu?",
    confirmLabel: "Tak, dodaj",
    success: "Pracownik dodany pomyślnie",
    error: "Błąd podczas dodawania pracownika",
  },
  edit: {
    title: "Edycja pracownika",
    submitLabel: "Zapisz",
    confirmMessage: "Czy na pewno chcesz zapisać zmiany danych pracownika?",
    confirmLabel: "Tak, zapisz",
    success: "Zmiany zapisane pomyślnie",
    error: "Błąd podczas zapisywania zmian",
  },
} as const;

export function EmployeeModal(props: EmployeeModalProps) {
  const { mode, isOpen, onClose } = props;
  const employee = props.mode === "edit" ? props.employee : null;
  const text = MODE_TEXT[mode];

  const queryClient = useQueryClient();
  const formRef = useRef<FormHandle>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [pendingSubmission, setPendingSubmission] =
    useState<PendingSubmission | null>(null);

  // Dodawanie: ostatnio używane wartości (lokalizacja, stanowisko, etat, godziny,
  // urlop). Edycja: dane pracownika z cache — bez dodatkowego zapytania.
  const rememberedDefaults = queryClient.getQueryData<RememberedEmployeeFields>(
    LAST_EMPLOYEE_DEFAULTS_QUERY_KEY,
  );
  const initialValues = useMemo(
    () =>
      employee
        ? employeeToFormValues(employee)
        : getDefaultEmployeeFormValues(rememberedDefaults),
    [employee, rememberedDefaults],
  );

  // Kontekst walidacji w edycji: własny PESEL nie jest "zajęty", a zmiana
  // wymiaru urlopu jest sprawdzana w API względem zapisanej wartości.
  const edited = useMemo<EditedEmployeeContext | undefined>(
    () =>
      employee
        ? {
            employeeId: employee.id,
            pesel: initialValues.pesel,
            leave: initialValues.leave,
            employmentDate: initialValues.employmentDate,
          }
        : undefined,
    [employee, initialValues],
  );

  const employeeMutation = useMutation({
    mutationFn: (submission: PendingSubmission) =>
      submission.mode === "create"
        ? ApiService.createEmployee(submission.values)
        : ApiService.updateEmployee(submission.employeeId, submission.dto),
    onSuccess: async (_savedEmployee, submission) => {
      toast.success(MODE_TEXT[submission.mode].success);

      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: QueryKeysService.employeesList(),
        }),
        queryClient.invalidateQueries({ queryKey: ["positions"] }),
      ];

      if (submission.mode === "edit") {
        const detailsKey = QueryKeysService.employeeDetails({
          employeeId: submission.employeeId,
        });
        // Apply the sent changes to the cached GET object right away (not the raw
        // PUT response — different shape: no `ok`, relations may be incomplete),
        // so e.g. a new employment date re-bounds the calendar instantly. The GET
        // refetch below then brings the authoritative data.
        queryClient.setQueryData<Employee>(detailsKey, (cached) =>
          cached ? applyEmployeeUpdate(cached, submission.dto) : cached,
        );
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: detailsKey }),
          // Zakładka "Urlopy" — wymiar urlopu mógł się zmienić.
          queryClient.invalidateQueries({
            queryKey: QueryKeysService.employeeLeave({
              employeeId: submission.employeeId,
            }),
          }),
        );
      }

      await Promise.all(invalidations);
    },
    onError: (error, submission) => {
      toast.error(error.message || MODE_TEXT[submission.mode].error);
    },
  });

  const handleModalClose = () => {
    formRef.current?.reset();
    onClose();
  };

  const handleFormSubmit = (
    values: EmployeeFormValues,
    dirtyFields: EmployeeDirtyFields,
  ) => {
    if (!employee) {
      setPendingSubmission({ mode: "create", values });
      setIsConfirmOpen(true);
      return;
    }

    const dto = buildEmployeeUpdateDto(values, dirtyFields);
    if (Object.keys(dto).length === 0) {
      toast.info("Brak zmian do zapisania");
      handleModalClose();
      return;
    }

    setPendingSubmission({ mode: "edit", employeeId: employee.id, dto });
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingSubmission) return;

    employeeMutation.mutate(pendingSubmission);
    if (pendingSubmission.mode === "create") {
      queryClient.setQueryData(
        LAST_EMPLOYEE_DEFAULTS_QUERY_KEY,
        pickRememberedFields(pendingSubmission.values),
      );
    }

    setIsConfirmOpen(false);
    onClose();
    formRef.current?.reset();
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => !open && handleModalClose()}
      >
        <DialogContent className="sm:max-w-4xl bg-white text-zinc-900 border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-wide">
              {text.title}
            </DialogTitle>
          </DialogHeader>

          <Form
            // Nowe dane pracownika (po zapisie) → świeży formularz z nowymi wartościami.
            key={employee?.updatedAt ?? "create"}
            ref={formRef}
            initialValues={initialValues}
            edited={edited}
            submitLabel={text.submitLabel}
            onSubmit={handleFormSubmit}
            onCancel={handleModalClose}
          />
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Potwierdzenie"
        message={text.confirmMessage}
        confirmText={text.confirmLabel}
        cancelText="Nie"
      />
    </>
  );
}
