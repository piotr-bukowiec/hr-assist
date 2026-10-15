import { FileText, Pencil, UserX, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmployeeHeaderProps {
  name: string;
  surname: string;
  /** Zwolniony pracownik — edycja zablokowana, "Zwolnij" zmienia się w "Przywróć". */
  isFired: boolean;
  /** Trwa zwalnianie/przywracanie — przycisk jest nieaktywny. */
  isFireActionPending?: boolean;
  onReport: () => void;
  onEdit: () => void;
  onFire: () => void;
  onRecover: () => void;
  onDelete: () => void;
}

export function EmployeeHeader({
  name,
  surname,
  isFired,
  isFireActionPending = false,
  onReport,
  onEdit,
  onFire,
  onRecover,
  onDelete,
}: EmployeeHeaderProps) {
  const fullNameUpper = `${name} ${surname}`.toUpperCase();

  return (
    <div className="mb-2 flex shrink-0 items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">{fullNameUpper}</h1>

      <Card className="p-1">
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" title="Raport" onClick={onReport}>
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={isFired ? "Nie można edytować zwolnionego pracownika" : "Edytuj"}
            onClick={onEdit}
            disabled={isFired}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {isFired ? (
            <Button
              variant="ghost"
              size="icon"
              title="Przywróć"
              onClick={onRecover}
              disabled={isFireActionPending}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              title="Zwolnij"
              onClick={onFire}
              disabled={isFireActionPending}
            >
              <UserX className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            title="Usuń"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
