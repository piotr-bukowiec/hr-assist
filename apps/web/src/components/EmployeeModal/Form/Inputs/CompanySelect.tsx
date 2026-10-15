import { useEffect } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import ms from "ms";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { ApiService } from "@/services/api.service";
import { EmployeeFormValues } from "../../employee.schema";
import { InputError } from "./InputError";
import { CompanyNameAndId } from "@/types";

export function CompanySelect() {
  const {
    control,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();
  const { field } = useController({ control, name: "company" });
  const error = errors.company;

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => await ApiService.getCompaniesNamesAndIds(),
    staleTime: ms("5 minutes"),
  });

  useEffect(() => {
    if (!field.value && companies.length > 0) {
      field.onChange(companies[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies]);

  const selectedCompany = companies.find(
    (company) => company.id === field.value,
  );

  return (
    <Field data-invalid={!!error}>
      <FieldLabel>
        Firma <span className="text-destructive">*</span>
      </FieldLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger
          aria-invalid={!!error}
          className="w-full overflow-hidden"
        >
          <SelectValue
            placeholder={isLoading ? "Ładowanie..." : "Wybierz firmę..."}
          >
            <span className="block truncate">
              {selectedCompany ? selectedCompany.name : field.value}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {companies.map(({ id, name }: CompanyNameAndId) => (
            <SelectItem key={id} value={id}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <InputError message={error && String(error.message)} />
    </Field>
  );
}
