import { useEffect, useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { matchVoice } from "@/lib/voice-commands";
import { sendCommand } from "@/lib/socket";
import { updateDevice, pushHistory, type AcMode, type AcFan } from "@/lib/devices-store";
import { toast } from "sonner";

// Mirror device state for AC commands so UI stays in sync.
function applyAcSideEffect(cmd: string) {
  if (cmd === "on") return updateDevice("ac", { on: true });
  if (cmd === "off") return updateDevice("ac", { on: false });
  if (["cool", "hot", "fan", "dry"].includes(cmd))
    return updateDevice("ac", { mode: cmd as AcMode, on: true });
  if (cmd.startsWith("fan_"))
    return updateDevice("ac", { fan: cmd.slice(4) as AcFan });
  const n = Number(cmd);
  if (Number.isFinite(n) && n >= 16 && n <= 30) return updateDevice("ac", { temp: n });
}

function applyTvSideEffect(cmd: string) {
  if (cmd === "p") updateDevice("tv", {});
}

export function VoiceFab() {
  const [open, setOpen] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const { supported, listening, transcript, start, stop } = useSpeechRecognition({
    lang: "fr-FR",
    continuous: false,
    onResult: (text, isFinal) => {
      if (!isFinal) return;
      const m = matchVoice(text);
      if (!m) {
        setLastResult(`❓ "${text}"`);
        toast.error("Commande inconnue", { description: text });
        return;
      }
      setLastResult(`✓ ${m.target.toUpperCase()} → ${m.cmd}`);
      pushHistory({ device: m.target, command: m.cmd });
      if (m.target === "ac") applyAcSideEffect(m.cmd);
      else applyTvSideEffect(m.cmd);
      sendCommand(m.target, m.cmd).catch(() =>
        toast.error("Bridge offline", { description: "Commande non envoyée" }),
      );
      toast.success(`${m.target.toUpperCase()} • ${m.cmd}`);
    },
    onError: (e) => {
      if (e === "not-allowed") toast.error("Micro refusé");
    },
  });

  useEffect(() => {
    if (!open) stop();
  }, [open, stop]);

  if (!supported) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Voice command"
        className="fixed z-40 right-5 bottom-24 w-14 h-14 rounded-full grid place-items-center text-primary-foreground shadow-2xl active:scale-95 transition"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "0 8px 24px oklch(0.72 0.18 240 / 0.55)",
        }}
      >
        <Mic className="w-6 h-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-background/70 backdrop-blur-md p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Commande vocale</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full grid place-items-center bg-muted active:scale-95"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid place-items-center py-6">
              <button
                onClick={() => (listening ? stop() : start())}
                aria-label={listening ? "Stop" : "Start"}
                className="w-24 h-24 rounded-full grid place-items-center text-primary-foreground transition"
                style={{
                  background: listening ? "oklch(0.65 0.22 25)" : "var(--gradient-primary)",
                  boxShadow: listening
                    ? "0 0 0 12px oklch(0.65 0.22 25 / 0.18)"
                    : "0 8px 24px oklch(0.72 0.18 240 / 0.4)",
                }}
              >
                {listening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
              </button>
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                {listening ? "Écoute…" : "Tap pour parler"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/40 p-3 min-h-[60px]">
              <p className="text-xs text-muted-foreground">Transcription</p>
              <p className="text-sm font-medium mt-1 break-words">
                {transcript || <span className="text-muted-foreground">…</span>}
              </p>
              {lastResult && <p className="text-xs mt-2 text-primary">{lastResult}</p>}
            </div>

            <div className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
              Essaie : <em>"clim 22"</em>, <em>"mode chaud"</em>, <em>"ventilation forte"</em>,
              <em> "tv volume plus"</em>, <em>"netflix"</em>, <em>"chaine 5"</em>.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
