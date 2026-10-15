import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { cn } from "@/lib/utils";

type ConfirmModalVariant = "danger" | "primary";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  /** While pending: both buttons are disabled and the modal cannot be closed. */
  isLoading?: boolean;
}

// "danger" — red background with white text, for irreversible actions (e.g. deletion).
const CONFIRM_BUTTON_CLASSES: Record<ConfirmModalVariant, string> = {
  primary: "",
  danger: "bg-destructive text-white hover:bg-destructive/90",
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Tak",
  cancelText = "Nie",
  variant = "primary",
  isLoading = false,
}: ConfirmModalProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-100 bg-white text-zinc-900 border-zinc-200 shadow-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="py-2 text-zinc-600">
          {message}
        </DialogDescription>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-zinc-300 text-zinc-700 bg-transparent hover:bg-zinc-100"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(CONFIRM_BUTTON_CLASSES[variant])}
          >
            {isLoading && <Loader2 className="animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
