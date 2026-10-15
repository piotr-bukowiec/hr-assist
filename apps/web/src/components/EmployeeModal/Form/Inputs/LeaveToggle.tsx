import { useController, useFormContext } from "react-hook-form";

import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { EmployeeFormValues } from "../../employee.schema";
import { InputError } from "./InputError";

export function LeaveToggle() {
  const {
    control,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const { field } = useController({ control, name: "leave" });
  const error = errors.leave;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        Urlop roczny <span className="text-destructive">*</span>
      </FieldLabel>
      <div
        aria-invalid={!!error}
        className="flex h-10 w-full items-center rounded-md bg-zinc-100 p-1 border border-zinc-200 aria-invalid:border-red-500"
      >
        <button
          type="button"
          onClick={() => field.onChange(20)}
          className={cn(
            "flex-1 h-full rounded text-xs font-medium transition-all flex items-center justify-center",
            field.value === 20
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900",
          )}
        >
          20 dni
        </button>
        <button
          type="button"
          onClick={() => field.onChange(26)}
          className={cn(
            "flex-1 h-full rounded text-xs font-medium transition-all flex items-center justify-center",
            field.value === 26
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-900",
          )}
        >
          26 dni
        </button>
      </div>
      <InputError message={error && String(error.message)} />
    </Field>
  );
}
