import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { EmployeeFormValues } from "../../employee.schema";
import { InputError } from "./InputError";

export function SurnameInput() {
  const {
    register,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const error = errors.surname;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        Nazwisko <span className="text-destructive">*</span>
      </FieldLabel>
      <Input
        placeholder="Nazwisko"
        {...register("surname")}
        aria-invalid={!!error}
      />
      <InputError message={error && String(error.message)} />
    </Field>
  );
}
