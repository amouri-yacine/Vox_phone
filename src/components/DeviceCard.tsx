import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Pencil, type LucideIcon } from "lucide-react";
import { useState } from "react";

export function DeviceCard({
  to,
  name,
  status,
  icon: Icon,
  on,
  onRename,
}: {
  to: "/ac" | "/tv";
  name: string;
  status: string;
  icon: LucideIcon;
  on: boolean;
  onRename?: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    const v = draft.trim();
    setEditing(false);
    if (v && v !== name) onRename?.(v);
    else setDraft(name);
  };

  return (
    <div className="relative">
      <Link to={to} className="block" onClick={(e) => editing && e.preventDefault()}>
        <motion.div
          whileTap={{ scale: editing ? 1 : 0.97 }}
          className="surface-card rounded-3xl p-5 min-h-[150px] flex flex-col justify-between border border-border overflow-hidden relative"
          style={{ boxShadow: on ? "var(--shadow-glow)" : "var(--shadow-card)" }}
        >
          {on && (
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl pointer-events-none"
              style={{ background: "var(--gradient-primary)" }}
            />
          )}
          <div className="flex items-start justify-between relative">
            <div
              className="w-12 h-12 rounded-2xl grid place-items-center"
              style={{
                background: on ? "var(--gradient-primary)" : "var(--muted)",
                color: on ? "var(--primary-foreground)" : "var(--muted-foreground)",
              }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full inline-flex items-center gap-1"
              style={{
                background: on ? "var(--primary)" : "var(--muted)",
                color: on ? "var(--primary-foreground)" : "var(--muted-foreground)",
              }}
            >
              {on && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
              {on ? "On" : "Off"}
            </span>
          </div>
          <div className="relative">
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") {
                    setDraft(name);
                    setEditing(false);
                  }
                }}
                onClick={(e) => e.preventDefault()}
                className="w-full bg-transparent border-b border-primary text-base font-semibold outline-none"
              />
            ) : (
              <h3 className="font-semibold text-base truncate pr-7">{name}</h3>
            )}
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{status}</p>
          </div>
        </motion.div>
      </Link>
      {onRename && !editing && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDraft(name);
            setEditing(true);
          }}
          aria-label={`Rename ${name}`}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full grid place-items-center bg-background/70 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground active:scale-90 transition"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
