import { Ref } from "react";
import { EditedEmployeeContext, EmployeeFormValues } from "../employee.schema";
import { EmployeeDirtyFields } from "@/utils/employee-form.utils";

export interface FormProps {
  ref?: Ref<FormHandle>;
  /** Wartości startowe — zapamiętane domyślne (dodawanie) albo dane pracownika (edycja). */
  initialValues: EmployeeFormValues;
  /** Tylko edycja — kontekst walidacji asynchronicznej (własny PESEL, zmiana urlopu). */
  edited?: EditedEmployeeContext;
  submitLabel: string;
  onSubmit: (
    values: EmployeeFormValues,
    dirtyFields: EmployeeDirtyFields,
  ) => void;
  onCancel: () => void;
}

export interface FormHandle {
  reset: () => void;
}
