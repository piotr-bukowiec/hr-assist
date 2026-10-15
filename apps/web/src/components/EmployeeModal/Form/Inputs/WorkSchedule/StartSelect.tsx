import { useMemo } from "react";
import { useController, useFormContext } from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { EmployeeFormValues } from "../../../employee.schema";
import { InputError } from "../InputError";

export function StartSelect() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const { field } = useController({ control, name: "workSchedule.start" });
  const error = errors.workSchedule?.start;
  const workHours = watch("workHours");

  const availableStartHours = useMemo(() => {
    const hours: string[] = [];
    const maxStart = Math.min(15, 16 - (Number(workHours) || 8));
    for (let i = 6; i <= maxStart; i++) {
      hours.push(i < 10 ? `0${i}:00` : `${i}:00`);
    }
    return hours;
  }, [workHours]);

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        Godzina startu (6:00 - 15:00) <span className="text-destructive">*</span>
      </FieldLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger aria-invalid={!!error} className="w-full">
          <SelectValue placeholder="Wybierz start..." />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className="max-h-48">
          {availableStartHours.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <InputError message={error && String(error.message)} />
    </Field>
  );
}
