import { Sidebar } from "@/components/Sidebar/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden" suppressHydrationWarning>
      <Sidebar />
      <main className="flex-1 overflow-y-auto overscroll-y-none bg-background">
        {children}
      </main>
    </div>
  );
}
