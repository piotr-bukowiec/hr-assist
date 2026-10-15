import { FieldDescription } from "@/components/ui/field";

interface InputErrorProps {
  message?: string;
}

// Zarezerwowana, stała wysokość: pojawienie się/zniknięcie błędu nie zmienia
// wysokości wiersza siatki formularza.
export function InputError({ message }: InputErrorProps) {
  return (
    <div className="h-4 overflow-hidden">
      {message && (
        <FieldDescription
          className="truncate text-[11px] font-medium text-red-500"
          title={message}
        >
          {message}
        </FieldDescription>
      )}
    </div>
  );
}
