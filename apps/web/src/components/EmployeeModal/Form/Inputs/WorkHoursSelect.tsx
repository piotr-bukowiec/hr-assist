import { useController, useFormContext } from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { EmployeeFormValues } from "../../employee.schema";
import { InputError } from "./InputError";

const WORK_HOURS_OPTIONS = [
  { value: 4, label: "1/2 (4h)" },
  { value: 6, label: "3/4 (6h)" },
  { value: 7, label: "7/8 (7h)" },
  { value: 8, label: "Pełen etat" },
] as const;

export function WorkHoursSelect() {
  const {
    control,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const { field } = useController({ control, name: "workHours" });
  const error = errors.workHours;
  const selectedOption = WORK_HOURS_OPTIONS.find(
    (option) => option.value === field.value,
  );

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        Wymiar etatu <span className="text-destructive">*</span>
      </FieldLabel>
      <Select
        onValueChange={(val) => field.onChange(Number(val))}
        value={field.value?.toString()}
      >
        <SelectTrigger aria-invalid={!!error} className="w-full">
          <SelectValue placeholder="Wybierz etat...">
            {selectedOption ? selectedOption.label : "Wybierz etat..."}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {WORK_HOURS_OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value.toString()}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <InputError message={error && String(error.message)} />
    </Field>
  );
}
