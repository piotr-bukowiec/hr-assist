import { Field, FieldLabel } from "@/components/ui/field";

export function ContractTypeField() {
  return (
    <Field>
      <FieldLabel>Typ umowy</FieldLabel>
      <div className="flex h-10 w-full items-center rounded-md bg-zinc-100 px-3 border border-zinc-200 text-sm text-zinc-700 font-medium">
        UoP
      </div>
    </Field>
  );
}
