import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { addHours, format, parse } from "date-fns";

import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { EmployeeFormValues } from "../../../employee.schema";
import { InputError } from "../InputError";

export function EndInput() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const error = errors.workSchedule?.end;
  const start = watch("workSchedule.start");
  const workHours = watch("workHours");

  useEffect(() => {
    if (!start || !workHours) return;
    try {
      const parsedStart = parse(start, "HH:00", new Date());
      const end = addHours(parsedStart, Number(workHours));
      setValue("workSchedule.end", format(end, "HH:00"));
    } catch {}
  }, [start, workHours, setValue]);

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        Godzina końcowa <span className="text-destructive">*</span>
      </FieldLabel>
      <Input
        type="text"
        disabled
        {...register("workSchedule.end")}
        aria-invalid={!!error}
        className="font-medium"
      />
      <InputError message={error && String(error.message)} />
    </Field>
  );
}
