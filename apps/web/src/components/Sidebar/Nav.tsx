"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const NAV_ITEMS = [
  { href: "/employees", label: "Pracownicy", icon: Users },
  { href: "/holidays", label: "Dni wolne", icon: CalendarDays },
] as const;

const navLinkClassName = (isActive: boolean) =>
  `relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-300 ${
    isActive
      ? "text-sidebar-primary"
      : "text-sidebar-foreground hover:bg-black/[0.04] hover:text-sidebar-primary"
  }`;

const isNavItemActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function Nav() {
  const pathname = usePathname();
  const [indicator, setIndicator] = useState({
    top: 0,
    height: 0,
    ready: false,
  });

  const navListRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const updateIndicator = useCallback(() => {
    const activeIndex = NAV_ITEMS.findIndex((item) =>
      isNavItemActive(pathname, item.href),
    );
    const activeItem = navItemRefs.current[activeIndex];
    const navList = navListRef.current;

    if (!activeItem || !navList) {
      setIndicator((current) => ({ ...current, ready: false }));
      return;
    }

    setIndicator({
      top: activeItem.offsetTop,
      height: activeItem.offsetHeight,
      ready: true,
    });
  }, [pathname]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const navList = navListRef.current;
    if (!navList) return;

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(navList);

    return () => resizeObserver.disconnect();
  }, [updateIndicator]);

  return (
    <nav className="flex-1 px-3 py-2">
      <div ref={navListRef} className="relative space-y-1">
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 rounded-lg bg-sidebar-accent ${
            indicator.ready
              ? "opacity-100 transition-[transform,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              : "opacity-0"
          }`}
          style={{
            height: indicator.height,
            transform: `translateY(${indicator.top}px)`,
          }}
        />
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(node) => {
                navItemRefs.current[index] = node;
              }}
              aria-current={isActive ? "page" : undefined}
              className={navLinkClassName(isActive)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
