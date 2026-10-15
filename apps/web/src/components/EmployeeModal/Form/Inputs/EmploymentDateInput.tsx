import { useMemo } from "react";
import { useController, useFormContext } from "react-hook-form";
import { format, parseISO, startOfMonth } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  EARLIEST_EMPLOYMENT_DATE,
  EmployeeFormValues,
  getLatestEmploymentDate,
} from "../../employee.schema";
import { InputError } from "./InputError";

export function EmploymentDateInput() {
  const {
    control,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const { field } = useController({ control, name: "employmentDate" });
  const error = errors.employmentDate;

  // Same bounds as the Zod rule (min: NEXT_PUBLIC_APP_START_DATE, max: end of
  // next year). Navigation starts at the 1st of the start month, so that month
  // renders as a full grid; days before the start date are disabled (greyed out).
  const latestEmploymentDate = useMemo(() => getLatestEmploymentDate(), []);
  const firstSelectableMonth = startOfMonth(EARLIEST_EMPLOYMENT_DATE);
  // "yyyy-MM-dd" as a local date — `new Date(...)` would parse it as UTC.
  const selectedDate = field.value ? parseISO(field.value) : undefined;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        Data rozpoczęcia <span className="text-destructive">*</span>
      </FieldLabel>
      <Popover>
        <PopoverTrigger>
          <div
            aria-invalid={!!error}
            className={cn(
              "w-full justify-start text-left font-normal bg-white border border-zinc-300 rounded-md h-10 px-3 text-sm text-zinc-900 hover:bg-zinc-50 flex items-center cursor-pointer aria-invalid:border-red-500",
              !field.value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
            {selectedDate ? (
              format(selectedDate, "d MMMM yyyy", { locale: pl })
            ) : (
              <span>Wybierz datę</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            locale={pl}
            weekStartsOn={1}
            disabled={{
              before: EARLIEST_EMPLOYMENT_DATE,
              after: latestEmploymentDate,
            }}
            startMonth={firstSelectableMonth}
            endMonth={latestEmploymentDate}
            defaultMonth={selectedDate}
            selected={selectedDate}
            onSelect={(date) =>
              field.onChange(date ? format(date, "yyyy-MM-dd") : "")
            }
          />
        </PopoverContent>
      </Popover>
      <InputError message={error && String(error.message)} />
    </Field>
  );
}
