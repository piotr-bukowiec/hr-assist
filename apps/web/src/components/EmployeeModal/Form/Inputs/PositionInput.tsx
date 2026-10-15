import { useController, useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import ms from "ms";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { ApiService } from "@/services/api.service";
import { EmployeeFormValues } from "../../employee.schema";
import { InputError } from "./InputError";

export function PositionInput() {
  const {
    control,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const { field } = useController({ control, name: "position" });
  const error = errors.position;

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => await ApiService.getPositions(),
    staleTime: ms("5 minutes"),
  });

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        Stanowisko <span className="text-destructive">*</span>
      </FieldLabel>
      <Combobox
        items={positions}
        value={field.value || null}
        onValueChange={(val) => field.onChange(val ?? "")}
      >
        <ComboboxInput
          placeholder="Wpisz lub wybierz stanowisko..."
          aria-invalid={!!error}
          value={field.value || ""}
          onChange={(e) => field.onChange(e.target.value)}
        />
        <ComboboxContent>
          <ComboboxEmpty>
            {isLoading
              ? "Ładowanie..."
              : "Brak wyników (wpisany tekst zostanie użyty)."}
          </ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <InputError message={error && String(error.message)} />
    </Field>
  );
}
