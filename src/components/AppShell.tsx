import { useEffect, type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { VoiceFab } from "./VoiceFab";
import { tickTimers } from "@/lib/automation-store";

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  useEffect(() => {
    tickTimers();
    const id = setInterval(() => tickTimers(), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      {title && (
        <header className="safe-top px-5 pb-3 pt-4">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </header>
      )}
      <main className="flex-1 pb-28 px-5 max-w-md w-full mx-auto">{children}</main>
      <VoiceFab />
      <BottomNav />
    </div>
  );
}
