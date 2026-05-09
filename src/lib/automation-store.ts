// Scenes (sequence of commands) + Timers (one-shot scheduled commands).
// Stored in localStorage. Timers run via a setInterval ticker mounted in AppShell.
import { useEffect, useState } from "react";
import { sendCommand } from "./socket";
import { updateDevice, pushHistory, type AcMode, type AcFan } from "./devices-store";

export interface SceneStep {
  device: "ac" | "tv";
  cmd: string;
  delayMs?: number; // wait before this step (default 250)
}
export interface Scene {
  id: string;
  name: string;
  emoji: string;
  steps: SceneStep[];
}

export interface Timer {
  id: string;
  label: string;
  device: "ac" | "tv";
  cmd: string;
  // HH:MM in local time
  time: string;
  // 0=Sunday … 6=Saturday. Empty = once.
  days: number[];
  enabled: boolean;
  lastFired?: number;
}

const SCENES_KEY = "smarthome-scenes-v1";
const TIMERS_KEY = "smarthome-timers-v1";

const DEFAULT_SCENES: Scene[] = [
  {
    id: "goodnight",
    name: "Bonne nuit",
    emoji: "🌙",
    steps: [
      { device: "tv", cmd: "p" },
      { device: "ac", cmd: "off", delayMs: 400 },
    ],
  },
  {
    id: "movie",
    name: "Cinéma",
    emoji: "🎬",
    steps: [
      { device: "ac", cmd: "on" },
      { device: "ac", cmd: "cool", delayMs: 300 },
      { device: "ac", cmd: "22", delayMs: 300 },
      { device: "tv", cmd: "p", delayMs: 500 },
      { device: "tv", cmd: "netflix", delayMs: 800 },
    ],
  },
  {
    id: "morning",
    name: "Réveil",
    emoji: "☀️",
    steps: [
      { device: "ac", cmd: "on" },
      { device: "ac", cmd: "cool", delayMs: 300 },
      { device: "ac", cmd: "24", delayMs: 300 },
    ],
  },
];

function applyAc(cmd: string) {
  if (cmd === "on") return updateDevice("ac", { on: true });
  if (cmd === "off") return updateDevice("ac", { on: false });
  if (["cool", "hot", "fan", "dry"].includes(cmd))
    return updateDevice("ac", { mode: cmd as AcMode, on: true });
  if (cmd.startsWith("fan_")) return updateDevice("ac", { fan: cmd.slice(4) as AcFan });
  const n = Number(cmd);
  if (Number.isFinite(n) && n >= 16 && n <= 30) return updateDevice("ac", { temp: n });
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

// ---------- Scenes ----------
export function useScenes() {
  const [list, setList] = useState<Scene[]>([]);
  useEffect(() => {
    const stored = readJson<Scene[] | null>(SCENES_KEY, null);
    if (!stored) {
      writeJson(SCENES_KEY, DEFAULT_SCENES);
      setList(DEFAULT_SCENES);
    } else setList(stored);
  }, []);
  return list;
}

export function saveScenes(scenes: Scene[]) {
  writeJson(SCENES_KEY, scenes);
}

export async function runScene(scene: Scene) {
  for (const step of scene.steps) {
    if (step.delayMs) await new Promise((r) => setTimeout(r, step.delayMs));
    pushHistory({ device: step.device, command: step.cmd });
    if (step.device === "ac") applyAc(step.cmd);
    if (step.device === "tv" && step.cmd === "p") updateDevice("tv", {});
    try {
      await sendCommand(step.device, step.cmd);
    } catch {
      // continue scene even if one step fails
    }
  }
}

// ---------- Timers ----------
export function useTimers() {
  const [list, setList] = useState<Timer[]>([]);
  useEffect(() => {
    setList(readJson<Timer[]>(TIMERS_KEY, []));
    const handler = () => setList(readJson<Timer[]>(TIMERS_KEY, []));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  return list;
}

export function saveTimers(timers: Timer[]) {
  writeJson(TIMERS_KEY, timers);
}

export function readTimers(): Timer[] {
  return readJson<Timer[]>(TIMERS_KEY, []);
}

// Called every minute by the ticker.
export async function tickTimers() {
  if (typeof window === "undefined") return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const cur = `${hh}:${mm}`;
  const day = now.getDay();
  const minuteStamp = Math.floor(now.getTime() / 60000);

  const timers = readTimers();
  let dirty = false;

  for (const t of timers) {
    if (!t.enabled) continue;
    if (t.time !== cur) continue;
    if (t.days.length > 0 && !t.days.includes(day)) continue;
    if (t.lastFired && Math.floor(t.lastFired / 60000) === minuteStamp) continue;

    t.lastFired = now.getTime();
    dirty = true;

    pushHistory({ device: t.device, command: t.cmd });
    if (t.device === "ac") applyAc(t.cmd);
    if (t.device === "tv" && t.cmd === "p") updateDevice("tv", {});
    try {
      await sendCommand(t.device, t.cmd);
    } catch {
      /* offline */
    }

    // Once-only timers disable themselves after firing.
    if (t.days.length === 0) t.enabled = false;
  }

  if (dirty) saveTimers(timers);
}
