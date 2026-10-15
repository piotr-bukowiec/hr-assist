"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/services/api.service";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserProfile } from "./UserProfile";
import { LogoutBtn } from "./LogoutBtn";

export function UserSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: async () => await ApiService.logout(),
    onSuccess: () => {
      router.replace("/login");
    },
    onError: ({ message }: Error) => {
      toast.error(message);
    },
    onSettled: () => {
      setOpen(false);
    },
  });

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return (
    <div className="px-3 pb-4">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="rounded-xl border border-primary">
          <PopoverTrigger
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent data-popup-open:bg-secondary/80 data-popup-open:text-secondary-foreground"
            aria-label="Opcje użytkownika"
          >
            <UserProfile />
            <ChevronRight
              size={14}
              className="ml-auto transform text-primary transition-transform duration-200 ease-in-out group-data-popup-open:-rotate-180"
            />
          </PopoverTrigger>
        </div>

        <PopoverContent
          side="right"
          align="end"
          sideOffset={8}
          className="w-52 rounded-xl p-3"
        >
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Konto
          </p>
          <LogoutBtn onLogoutBtnClick={handleLogout} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
