import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { PowerButton } from "@/components/PowerButton";
import { useDevices, updateDevice, pushHistory } from "@/lib/devices-store";
import { sendCommand } from "@/lib/socket";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { matchTvCommand } from "@/lib/voice-commands";
import { toast } from "sonner";
import {
  ArrowLeft,
  Tv,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings2,
  Info,
  Play,
  Pause,
  Square,
  Rewind,
  FastForward,
  ArrowLeftCircle,
  LogOut as ExitIcon,
  Mic,
  MicOff,
} from "lucide-react";

export const Route = createFileRoute("/tv")({
  component: TVPage,
});

function TVPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { tv } = useDevices();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const send = useCallback(async (cmd: string) => {
    pushHistory({ device: "tv", command: cmd });
    try {
      await sendCommand("tv", cmd);
    } catch {
      toast.error("TV unreachable", { description: "Check the ESP8266 connection in Settings." });
    }
  }, []);

  // --- Commande vocale -----------------------------------------------------
  // On garde la derniere phrase traitee pour eviter d'envoyer 2x la meme
  // commande pendant que la reconnaissance accumule des resultats partiels.
  const lastHandledRef = useRef<string>("");

  const handleVoice = useCallback((text: string, isFinal: boolean) => {
    if (!isFinal) return;
    if (text === lastHandledRef.current) return;
    lastHandledRef.current = text;
    const cmd = matchTvCommand(text);
    if (!cmd) {
      toast(`Pas compris: "${text}"`, { description: "Essaye: on, off, mute, volume plus, chaine 5..." });
      return;
    }
    if (cmd === "p") updateDevice("tv", { on: !tv.on });
    if (cmd === "v+") updateDevice("tv", { volume: Math.min(100, tv.volume + 5) });
    if (cmd === "v-") updateDevice("tv", { volume: Math.max(0, tv.volume - 5) });
    toast.success(`🎙️ ${text}`, { description: `→ ${cmd}` });
    send(cmd);
  }, [send, tv.on, tv.volume]);

  const { supported: voiceSupported, listening, start: startVoice, stop: stopVoice } = useSpeechRecognition({
    lang: "fr-FR",
    continuous: true,
    onResult: handleVoice,
    onError: (err) => {
      if (err === "not-allowed") {
        toast.error("Micro refuse", { description: "Autorise l'acces au micro dans les reglages du navigateur." });
      }
    },
  });

  if (!user) return null;

  const togglePower = () => {
    updateDevice("tv", { on: !tv.on });
    send("p");
  };
  const changeVol = (delta: number) => {
    if (!tv.on) return;
    const v = Math.max(0, Math.min(100, tv.volume + delta));
    updateDevice("tv", { volume: v });
    send(delta > 0 ? "v+" : "v-");
  };

  const toggleVoice = () => {
    if (!voiceSupported) {
      toast.error("Reconnaissance vocale non supportee", { description: "Utilise Chrome ou Edge." });
      return;
    }
    if (listening) stopVoice();
    else startVoice();
  };

  const navBtn =
    "grid place-items-center bg-muted rounded-2xl active:scale-95 active:bg-primary/30 transition disabled:opacity-30 min-h-[56px]";
  const tile =
    "rounded-2xl bg-card border border-border min-h-[56px] grid place-items-center text-sm font-semibold active:scale-95 disabled:opacity-40 transition";

  return (
    <AppShell>
      <div className="flex items-center justify-between safe-top -mx-1">
        <Link to="/" className="w-12 h-12 grid place-items-center rounded-2xl bg-card border border-border active:scale-95">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Living room</p>
          <h1 className="text-lg font-semibold">TV Remote</h1>
        </div>
        <div className="w-12 h-12 grid place-items-center rounded-2xl" style={{ background: tv.on ? "var(--primary)" : "var(--muted)" }}>
          <Tv className="w-5 h-5" style={{ color: tv.on ? "var(--primary-foreground)" : "var(--muted-foreground)" }} />
        </div>
      </div>

      {/* Bouton micro */}
      <button
        onClick={toggleVoice}
        className="mt-4 w-full min-h-[56px] rounded-2xl border border-border flex items-center justify-center gap-3 active:scale-[0.98] transition font-semibold"
        style={listening ? { background: "var(--gradient-primary)", color: "var(--primary-foreground)" } : { background: "var(--card)" }}
        aria-pressed={listening}
      >
        {listening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
        <span className="text-sm uppercase tracking-widest">
          {listening ? "Ecoute..." : "Commande vocale"}
        </span>
      </button>

      {/* Power + quick toggles */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <button onClick={togglePower} className={tile} aria-label="Power">
          <span className="text-xs uppercase tracking-widest">Power</span>
        </button>
        <button disabled={!tv.on} onClick={() => send("mute")} className={tile}>
          <VolumeX className="w-5 h-5" />
        </button>
        <button disabled={!tv.on} onClick={() => send("input")} className={tile}>
          <span className="text-xs uppercase tracking-widest">Input</span>
        </button>
      </div>

      {/* Volume + Channel rockers */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-2 flex items-center justify-between">
          <button disabled={!tv.on} onClick={() => changeVol(-5)} className="w-12 h-12 grid place-items-center rounded-xl bg-muted active:scale-95 disabled:opacity-40">
            <Minus className="w-5 h-5" />
          </button>
          <div className="text-center">
            <Volume2 className="w-4 h-4 mx-auto text-muted-foreground" />
            <span className="text-xs text-muted-foreground tabular-nums">{tv.volume}</span>
          </div>
          <button disabled={!tv.on} onClick={() => changeVol(5)} className="w-12 h-12 grid place-items-center rounded-xl bg-muted active:scale-95 disabled:opacity-40">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="rounded-2xl bg-card border border-border p-2 flex items-center justify-between">
          <button disabled={!tv.on} onClick={() => send("c-")} className="w-12 h-12 grid place-items-center rounded-xl bg-muted active:scale-95 disabled:opacity-40">
            <Minus className="w-5 h-5" />
          </button>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">CH</span>
          <button disabled={!tv.on} onClick={() => send("c+")} className="w-12 h-12 grid place-items-center rounded-xl bg-muted active:scale-95 disabled:opacity-40">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Number pad */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button key={n} disabled={!tv.on} onClick={() => send(n)} className={tile}>
            {n}
          </button>
        ))}
        <button disabled={!tv.on} onClick={() => send("list")} className={tile}>
          <span className="text-xs uppercase">List</span>
        </button>
        <button disabled={!tv.on} onClick={() => send("0")} className={tile}>
          0
        </button>
        <button disabled={!tv.on} onClick={() => send("back")} className={tile}>
          <ArrowLeftCircle className="w-5 h-5" />
        </button>
      </div>

      {/* D-Pad */}
      <div className="mt-6 grid grid-cols-3 grid-rows-3 gap-2">
        <div />
        <button disabled={!tv.on} onClick={() => send("up")} className={navBtn}>
          <ChevronUp className="w-6 h-6" />
        </button>
        <div />
        <button disabled={!tv.on} onClick={() => send("left")} className={navBtn}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          disabled={!tv.on}
          onClick={() => send("ok")}
          className="grid place-items-center rounded-2xl active:scale-95 transition font-bold disabled:opacity-30"
          style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
        >
          OK
        </button>
        <button disabled={!tv.on} onClick={() => send("right")} className={navBtn}>
          <ChevronRight className="w-6 h-6" />
        </button>
        <div />
        <button disabled={!tv.on} onClick={() => send("down")} className={navBtn}>
          <ChevronDown className="w-6 h-6" />
        </button>
        <div />
      </div>

      {/* Home / Info / Settings / Exit */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <button disabled={!tv.on} onClick={() => send("home")} className={tile}>
          <Home className="w-5 h-5" />
        </button>
        <button disabled={!tv.on} onClick={() => send("info")} className={tile}>
          <Info className="w-5 h-5" />
        </button>
        <button disabled={!tv.on} onClick={() => send("settings")} className={tile}>
          <Settings2 className="w-5 h-5" />
        </button>
        <button disabled={!tv.on} onClick={() => send("exit")} className={tile}>
          <ExitIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Media controls */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        <button disabled={!tv.on} onClick={() => send("rew")} className={tile}>
          <Rewind className="w-5 h-5" />
        </button>
        <button disabled={!tv.on} onClick={() => send("play")} className={tile}>
          <Play className="w-5 h-5" />
        </button>
        <button disabled={!tv.on} onClick={() => send("pause")} className={tile}>
          <Pause className="w-5 h-5" />
        </button>
        <button disabled={!tv.on} onClick={() => send("stop")} className={tile}>
          <Square className="w-4 h-4" />
        </button>
        <button disabled={!tv.on} onClick={() => send("ff")} className={tile}>
          <FastForward className="w-5 h-5" />
        </button>
      </div>

      {/* Color buttons */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { cmd: "red", color: "#ef4444" },
          { cmd: "green", color: "#22c55e" },
          { cmd: "yellow", color: "#eab308" },
          { cmd: "blue", color: "#3b82f6" },
        ].map((c) => (
          <button
            key={c.cmd}
            disabled={!tv.on}
            onClick={() => send(c.cmd)}
            className="rounded-2xl min-h-[44px] active:scale-95 disabled:opacity-40 transition border border-border"
            style={{ background: c.color }}
            aria-label={c.cmd}
          />
        ))}
      </div>

      {/* Apps + inputs */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button disabled={!tv.on} onClick={() => send("netflix")} className={tile}>
          Netflix
        </button>
        <button disabled={!tv.on} onClick={() => send("amazon")} className={tile}>
          Prime Video
        </button>
        <button disabled={!tv.on} onClick={() => send("hdmi1")} className={tile}>
          HDMI 1
        </button>
        <button disabled={!tv.on} onClick={() => send("hdmi2")} className={tile}>
          HDMI 2
        </button>
        <button disabled={!tv.on} onClick={() => send("hdmi3")} className={tile}>
          HDMI 3
        </button>
        <button disabled={!tv.on} onClick={() => send("hdmi4")} className={tile}>
          HDMI 4
        </button>
      </div>

      {/* Big power */}
      <div className="mt-8 mb-4 flex flex-col items-center gap-3">
        <PowerButton on={tv.on} onToggle={togglePower} label="Toggle TV power" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">
          {tv.on ? "On" : "Off"}
        </span>
      </div>
    </AppShell>
  );
}
