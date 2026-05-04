import { Power } from "lucide-react";

export function PowerButton({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={label ?? "Toggle power"}
      className="w-16 h-16 rounded-full grid place-items-center active:scale-90 transition-all"
      style={{
        background: on ? "var(--gradient-primary)" : "var(--muted)",
        boxShadow: on ? "var(--shadow-glow)" : "none",
        color: on ? "var(--primary-foreground)" : "var(--muted-foreground)",
      }}
    >
      <Power className="w-7 h-7" strokeWidth={2.5} />
    </button>
  );
}
