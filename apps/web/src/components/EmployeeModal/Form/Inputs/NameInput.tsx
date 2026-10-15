import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { EmployeeFormValues } from "../../employee.schema";
import { InputError } from "./InputError";

export function NameInput() {
  const {
    register,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const error = errors.name;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        Imię <span className="text-destructive">*</span>
      </FieldLabel>
      <Input placeholder="Imię" {...register("name")} aria-invalid={!!error} />
      <InputError message={error && String(error.message)} />
    </Field>
  );
}
