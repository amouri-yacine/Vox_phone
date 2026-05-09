import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { useHistory } from "@/lib/devices-store";
import { Snowflake, Tv } from "lucide-react";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const history = useHistory();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);
  if (!user) return null;

  return (
    <AppShell title="History">
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-4">
          No commands sent yet. Control a device to see activity here.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {history.map((h) => {
            const Icon = h.device === "ac" ? Snowflake : Tv;
            return (
              <li
                key={h.id}
                className="surface-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {h.device.toUpperCase()} · {h.command}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.ts).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
