import { Link, useLocation } from "@tanstack/react-router";
import { Home, Settings, Sparkles, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/automation", label: "Auto", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom border-t border-border bg-card/90 backdrop-blur-xl">
      <ul className="grid grid-cols-4 max-w-md mx-auto">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] active:scale-95 transition-transform"
              >
                <Icon
                  className="w-6 h-6 transition-colors"
                  style={{
                    color: active ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                />
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color: active ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
