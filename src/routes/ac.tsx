import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { PowerButton } from "@/components/PowerButton";
import { useDevices, updateDevice, pushHistory, type AcMode, type AcFan } from "@/lib/devices-store";
import { sendCommand } from "@/lib/socket";
import { ArrowLeft, Snowflake, Flame, Wind, Droplets, Minus, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ac")({
  component: ACPage,
});

const TEMP_PRESETS = [16, 18, 20, 22, 24, 26, 28, 30] as const;
const MODES: { id: AcMode; label: string; icon: typeof Snowflake; cmd: string }[] = [
  { id: "cool", label: "Cool", icon: Snowflake, cmd: "cool" },
  { id: "hot", label: "Hot", icon: Flame, cmd: "hot" },
  { id: "fan", label: "Fan", icon: Wind, cmd: "fan" },
  { id: "dry", label: "Dry", icon: Droplets, cmd: "dry" },
];
const FANS: { id: AcFan; label: string; cmd: string }[] = [
  { id: "auto", label: "Auto", cmd: "fan_auto" },
  { id: "low", label: "Low", cmd: "fan_low" },
  { id: "med", label: "Med", cmd: "fan_med" },
  { id: "high", label: "High", cmd: "fan_high" },
];

function ACPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { ac } = useDevices();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (!user) return null;

  // Theme: cool = blue, hot = orange, others = neutral primary
  const isHot = ac.on && ac.mode === "hot";
  const isCool = ac.on && ac.mode === "cool";
  const accent = isHot
    ? "oklch(0.72 0.18 45)"
    : isCool
      ? "oklch(0.70 0.18 235)"
      : "var(--primary)";
  const accentSoft = isHot
    ? "oklch(0.72 0.18 45 / 0.15)"
    : isCool
      ? "oklch(0.70 0.18 235 / 0.15)"
      : "var(--muted)";

  const send = async (cmd: string) => {
    pushHistory({ device: "ac", command: cmd });
    try {
      await sendCommand("ac", cmd);
    } catch {
      toast.error("Device offline", { description: "Could not reach the bridge" });
    }
  };

  const togglePower = () => {
    const next = !ac.on;
    updateDevice("ac", { on: next });
    send(next ? "on" : "off");
  };

  const setMode = (m: AcMode) => {
    updateDevice("ac", { mode: m, on: true });
    const found = MODES.find((x) => x.id === m);
    if (found) send(found.cmd);
  };

  const setFan = (f: AcFan) => {
    updateDevice("ac", { fan: f });
    const found = FANS.find((x) => x.id === f);
    if (found && ac.on) send(found.cmd);
  };

  const setTemp = (t: number) => {
    const clamped = Math.max(16, Math.min(30, t));
    updateDevice("ac", { temp: clamped });
    if (ac.on) send(String(clamped));
  };

  const swing = () => {
    if (!ac.on) return;
    send("swing");
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between safe-top -mx-1">
        <Link to="/" className="w-12 h-12 grid place-items-center rounded-2xl bg-card border border-border active:scale-95">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Living room</p>
          <h1 className="text-lg font-semibold">{ac.name}</h1>
        </div>
        <div
          className="w-12 h-12 grid place-items-center rounded-2xl transition-colors"
          style={{ background: ac.on ? accent : "var(--muted)" }}
        >
          {isHot ? (
            <Flame className="w-5 h-5" style={{ color: "white" }} />
          ) : (
            <Snowflake
              className="w-5 h-5"
              style={{ color: ac.on ? "white" : "var(--muted-foreground)" }}
            />
          )}
        </div>
      </div>

      {/* Big temperature display */}
      <div
        className="mt-6 rounded-3xl border border-border p-6 relative overflow-hidden transition-colors"
        style={{ background: ac.on ? accentSoft : "var(--card)" }}
      >
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-50"
          style={{ background: ac.on ? accent : "transparent" }}
        />
        <div className="relative flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {ac.on ? `${ac.mode.toUpperCase()} • Fan ${ac.fan}` : "Standby"}
          </span>
          <div
            className="text-7xl font-bold tabular-nums mt-2"
            style={{ color: ac.on ? accent : "var(--muted-foreground)", opacity: ac.on ? 1 : 0.4 }}
          >
            {ac.temp}°
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              disabled={!ac.on || ac.temp <= 16}
              onClick={() => setTemp(ac.temp - 2)}
              className="w-12 h-12 grid place-items-center rounded-full bg-card border border-border active:scale-95 disabled:opacity-40"
              aria-label="Decrease temperature"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              disabled={!ac.on || ac.temp >= 30}
              onClick={() => setTemp(ac.temp + 2)}
              className="w-12 h-12 grid place-items-center rounded-full bg-card border border-border active:scale-95 disabled:opacity-40"
              aria-label="Increase temperature"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mode</h3>
        <div className="grid grid-cols-4 gap-2">
          {MODES.map((m) => {
            const active = ac.on && ac.mode === m.id;
            const color = m.id === "hot" ? "oklch(0.72 0.18 45)" : m.id === "cool" ? "oklch(0.70 0.18 235)" : "var(--primary)";
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className="rounded-2xl border min-h-[72px] flex flex-col items-center justify-center gap-1 active:scale-95 transition"
                style={{
                  background: active ? color : "var(--card)",
                  color: active ? "white" : "var(--foreground)",
                  borderColor: active ? color : "var(--border)",
                }}
              >
                <m.icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Temp presets */}
      <div className="mt-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Temperature</h3>
        <div className="grid grid-cols-4 gap-2">
          {TEMP_PRESETS.map((p) => {
            const active = ac.on && ac.temp === p;
            return (
              <button
                key={p}
                disabled={!ac.on}
                onClick={() => setTemp(p)}
                className="rounded-2xl border min-h-[52px] font-semibold active:scale-95 disabled:opacity-40 transition"
                style={{
                  background: active ? accent : "var(--card)",
                  color: active ? "white" : "var(--foreground)",
                  borderColor: active ? accent : "var(--border)",
                }}
              >
                {p}°
              </button>
            );
          })}
        </div>
      </div>

      {/* Fan speed */}
      <div className="mt-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fan speed</h3>
        <div className="grid grid-cols-4 gap-2">
          {FANS.map((f) => {
            const active = ac.fan === f.id;
            return (
              <button
                key={f.id}
                disabled={!ac.on}
                onClick={() => setFan(f.id)}
                className="rounded-2xl border min-h-[52px] font-semibold active:scale-95 disabled:opacity-40 transition"
                style={{
                  background: active && ac.on ? accent : "var(--card)",
                  color: active && ac.on ? "white" : "var(--foreground)",
                  borderColor: active && ac.on ? accent : "var(--border)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Swing + Power */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          onClick={swing}
          disabled={!ac.on}
          className="flex flex-col items-center gap-1 disabled:opacity-40"
          aria-label="Toggle swing"
        >
          <span className="w-14 h-14 grid place-items-center rounded-2xl bg-card border border-border active:scale-95">
            <RefreshCw className="w-5 h-5" />
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Swing</span>
        </button>

        <div className="flex flex-col items-center gap-1">
          <PowerButton on={ac.on} onToggle={togglePower} label="Toggle AC power" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {ac.on ? (isHot ? "Heating" : isCool ? "Cooling" : "Running") : "Off"}
          </span>
        </div>
      </div>
    </AppShell>
  );
}
