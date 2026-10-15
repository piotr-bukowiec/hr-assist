import { LogOut } from "lucide-react";

export function LogoutBtn({
  onLogoutBtnClick,
}: {
  onLogoutBtnClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onLogoutBtnClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left hover:bg-accent text-foreground cursor-pointer"
    >
      <LogOut size={15} />
      Wyloguj
    </button>
  );
}
