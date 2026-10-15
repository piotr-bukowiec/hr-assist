import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { EmployeeFormValues } from "../../employee.schema";
import { getBirthDateFromPesel } from "../../pesel.utils";

export function PeselInput() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const error = errors.pesel;
  const pesel = watch("pesel");
  const birthDate = !error ? getBirthDateFromPesel(pesel ?? "") : null;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        PESEL <span className="text-destructive">*</span>
      </FieldLabel>
      <Input
        placeholder="11 cyfr"
        maxLength={11}
        {...register("pesel", {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
          },
        })}
        aria-invalid={!!error}
        className="font-mono"
      />
      <div className="h-4 overflow-hidden">
        {error ? (
          <FieldDescription
            className="truncate text-[11px] font-medium text-red-500"
            title={String(error.message)}
          >
            {String(error.message)}
          </FieldDescription>
        ) : birthDate ? (
          <FieldDescription className="truncate text-[11px] text-zinc-500">
            Data urodzenia: {format(birthDate, "dd.MM.yyyy", { locale: pl })}
          </FieldDescription>
        ) : null}
      </div>
    </Field>
  );
}
