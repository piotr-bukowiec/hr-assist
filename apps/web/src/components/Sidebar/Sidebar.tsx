"use client";

import { Header } from "./Header";
import { Nav } from "./Nav";
import { UserSection } from "./UserSection";

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 h-screen flex flex-col bg-sidebar border-r border-sidebar-border overflow-visible">
      <Header />
      <Nav />
      <UserSection />
    </aside>
  );
}
