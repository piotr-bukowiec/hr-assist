import { useImperativeHandle, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { createEmployeeSchema, EmployeeFormValues } from "../employee.schema";
import { NameInput } from "./Inputs/NameInput";
import { SurnameInput } from "./Inputs/SurnameInput";
import { PeselInput } from "./Inputs/PeselInput";
import { PositionInput } from "./Inputs/PositionInput";
import { LocationToggle } from "./Inputs/LocationToggle";
import { CompanySelect } from "./Inputs/CompanySelect";
import { WorkHoursSelect } from "./Inputs/WorkHoursSelect";
import { StartSelect } from "./Inputs/WorkSchedule/StartSelect";
import { EndInput } from "./Inputs/WorkSchedule/EndInput";
import { EmploymentDateInput } from "./Inputs/EmploymentDateInput";
import { ContractTypeField } from "./Inputs/ContractTypeField";
import { LeaveToggle } from "./Inputs/LeaveToggle";
import { FormProps } from "./Form.types";

export function Form({
  ref,
  initialValues,
  edited,
  submitLabel,
  onSubmit,
  onCancel,
}: FormProps) {
  // Jeden schemat na czas życia formularza — trzyma też cache sprawdzeń urlopu.
  const schema = useMemo(() => createEmployeeSchema(edited), [edited]);

  const methods = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: initialValues,
  });

  // `dirtyFields` odczytany w renderze — react-hook-form zaczyna je śledzić.
  const {
    handleSubmit,
    reset,
    formState: { dirtyFields },
  } = methods;

  useImperativeHandle(
    ref,
    () => ({
      reset: () => reset(initialValues),
    }),
    [reset, initialValues],
  );

  const handleCancel = () => {
    reset(initialValues);
    onCancel();
  };

  const handleValidSubmit = (values: EmployeeFormValues) =>
    onSubmit(values, dirtyFields);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(handleValidSubmit)}
        className="space-y-6 mt-2"
        noValidate
      >
        <div className="grid grid-cols-3 gap-4">
          <NameInput />
          <SurnameInput />
          <PeselInput />
        </div>

        <div className="grid grid-cols-3 gap-4 items-start">
          <PositionInput />
          <LocationToggle />
          <CompanySelect />
        </div>

        <div className="grid grid-cols-3 gap-4 items-start">
          <WorkHoursSelect />
          <StartSelect />
          <EndInput />
        </div>

        <div className="grid grid-cols-3 gap-4 items-start">
          <EmploymentDateInput />
          <ContractTypeField />
          <LeaveToggle />
        </div>

        <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-zinc-200 bg-transparent">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="bg-transparent border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            Anuluj
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
