import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import {
  useScenes,
  runScene,
  useTimers,
  saveTimers,
  type Timer,
} from "@/lib/automation-store";
import { Play, Plus, Trash2, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/automation")({
  component: AutomationPage,
});

const DAYS = ["D", "L", "M", "M", "J", "V", "S"];

function AutomationPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const scenes = useScenes();
  const timers = useTimers();
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);
  if (!user) return null;

  const toggleTimer = (id: string) => {
    const next = timers.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
    saveTimers(next);
    window.dispatchEvent(new Event("storage"));
  };
  const removeTimer = (id: string) => {
    saveTimers(timers.filter((t) => t.id !== id));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <AppShell title="Automation">
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Scènes & programmation horaire.
      </p>

      {/* Scenes */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Scènes
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {scenes.map((s) => (
          <button
            key={s.id}
            onClick={() =>
              runScene(s).then(() => toast.success(`${s.emoji} ${s.name}`))
            }
            className="surface-card rounded-2xl border border-border p-4 text-left active:scale-[0.97] transition"
          >
            <div className="text-2xl">{s.emoji}</div>
            <div className="mt-2 font-semibold">{s.name}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {s.steps.length} action{s.steps.length > 1 ? "s" : ""}
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
              <Play className="w-3 h-3" /> Lancer
            </div>
          </button>
        ))}
      </div>

      {/* Timers */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Programmation
        </h2>
        <button
          onClick={() => setAdding(true)}
          className="text-xs font-semibold text-primary inline-flex items-center gap-1 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      {timers.length === 0 ? (
        <div className="surface-card rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Aucun timer. Crée-en un pour automatiser ta clim ou TV.
        </div>
      ) : (
        <ul className="space-y-2">
          {timers.map((t) => (
            <li
              key={t.id}
              className="surface-card rounded-2xl border border-border p-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums">{t.time}</span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t.device} • {t.cmd}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {t.label || "Sans nom"} ·{" "}
                  {t.days.length === 0
                    ? "une fois"
                    : t.days.map((d) => DAYS[d]).join(" ")}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={t.enabled}
                  onChange={() => toggleTimer(t.id)}
                />
                <div className="w-10 h-6 bg-muted rounded-full peer-checked:bg-primary transition relative">
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform"
                    style={{ transform: t.enabled ? "translateX(16px)" : "none" }}
                  />
                </div>
              </label>
              <button
                onClick={() => removeTimer(t.id)}
                aria-label="Delete"
                className="w-9 h-9 rounded-xl grid place-items-center bg-muted active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding && <AddTimerSheet onClose={() => setAdding(false)} />}
    </AppShell>
  );
}

function AddTimerSheet({ onClose }: { onClose: () => void }) {
  const [time, setTime] = useState("08:00");
  const [device, setDevice] = useState<"ac" | "tv">("ac");
  const [cmd, setCmd] = useState("on");
  const [label, setLabel] = useState("");
  const [days, setDays] = useState<number[]>([]);

  const AC_CMDS = ["on", "off", "cool", "hot", "fan", "dry", "22", "24", "26"];
  const TV_CMDS = ["p", "v+", "v-", "mute", "netflix"];
  const cmds = device === "ac" ? AC_CMDS : TV_CMDS;

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const save = () => {
    const next: Timer = {
      id: crypto.randomUUID(),
      label: label.trim(),
      device,
      cmd,
      time,
      days,
      enabled: true,
    };
    const list = JSON.parse(localStorage.getItem("smarthome-timers-v1") || "[]");
    list.push(next);
    localStorage.setItem("smarthome-timers-v1", JSON.stringify(list));
    window.dispatchEvent(new Event("storage"));
    toast.success("Timer créé");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-background/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold">Nouveau timer</h3>

        <div>
          <label className="text-xs text-muted-foreground">Nom</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Allumer clim avant arrivée"
            className="w-full mt-1 min-h-[44px] rounded-xl bg-background border border-border px-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Heure</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full mt-1 min-h-[44px] rounded-xl bg-background border border-border px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Appareil</label>
            <select
              value={device}
              onChange={(e) => {
                const d = e.target.value as "ac" | "tv";
                setDevice(d);
                setCmd(d === "ac" ? "on" : "p");
              }}
              className="w-full mt-1 min-h-[44px] rounded-xl bg-background border border-border px-3 text-sm"
            >
              <option value="ac">Clim</option>
              <option value="tv">TV</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Commande</label>
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {cmds.map((c) => (
              <button
                key={c}
                onClick={() => setCmd(c)}
                className="rounded-lg border min-h-[40px] text-xs font-semibold active:scale-95"
                style={{
                  background: cmd === c ? "var(--primary)" : "var(--card)",
                  color: cmd === c ? "var(--primary-foreground)" : "var(--foreground)",
                  borderColor: cmd === c ? "var(--primary)" : "var(--border)",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Jours (vide = une fois)</label>
          <div className="grid grid-cols-7 gap-1 mt-1">
            {DAYS.map((d, i) => {
              const active = days.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className="rounded-lg min-h-[40px] text-xs font-bold active:scale-95"
                  style={{
                    background: active ? "var(--primary)" : "var(--card)",
                    color: active ? "var(--primary-foreground)" : "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl bg-muted font-semibold active:scale-95"
          >
            Annuler
          </button>
          <button
            onClick={save}
            className="flex-1 min-h-[48px] rounded-xl text-primary-foreground font-semibold active:scale-95"
            style={{ background: "var(--gradient-primary)" }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
