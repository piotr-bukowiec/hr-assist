"use client";
import { useAuthStore, UserProfile } from "@/store/useAuthStore";

const SIDEBAR_FLYOUT_PROFILE_TEXT =
  "text-sm font-semibold text-sidebar-foreground group-data-[state=open]:text-secondary-foreground truncate";

export function UserProfile() {
  const user = useAuthStore((state) => state.user) as UserProfile | null;

  if (!user) return null;

  const { name, surname } = user;
  const initials = `${name[0].toUpperCase()}${surname[0].toUpperCase()}`;

  return (
    <>
      <div
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <span className="text-xs font-bold text-primary-foreground">
          {initials}
        </span>
      </div>
      <div className="leading-tight min-w-0">
        <div className={SIDEBAR_FLYOUT_PROFILE_TEXT}>{name}</div>
        <div className={SIDEBAR_FLYOUT_PROFILE_TEXT}>{surname}</div>
      </div>
    </>
  );
}
