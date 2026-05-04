// Lightweight device state + history kept in localStorage.
// In a future iteration this can sync to Supabase; for v1 we keep it local
// so commands feel instant even if the Pi is offline.
import { useEffect, useState } from "react";

export interface HistoryEntry {
  id: string;
  device: "ac" | "tv";
  command: string;
  ts: number;
}

const KEY = "smarthome-state-v1";
const HKEY = "smarthome-history-v1";

export type AcMode = "cool" | "hot" | "fan" | "dry";
export type AcFan = "auto" | "low" | "med" | "high";

export interface DeviceState {
  ac: { on: boolean; temp: number; name: string; mode: AcMode; fan: AcFan };
  tv: { on: boolean; volume: number; name: string };
}

const DEFAULT: DeviceState = {
  ac: { on: false, temp: 24, name: "Air Conditioner", mode: "cool", fan: "auto" },
  tv: { on: false, volume: 20, name: "Living Room TV" },
};

function read(): DeviceState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      ac: { ...DEFAULT.ac, ...(stored.ac || {}) },
      tv: { ...DEFAULT.tv, ...(stored.tv || {}) },
    };
  } catch {
    return DEFAULT;
  }
}

const listeners = new Set<(s: DeviceState) => void>();
let current = DEFAULT;
let initialized = false;

function init() {
  if (initialized || typeof window === "undefined") return;
  current = read();
  initialized = true;
}

export function useDevices() {
  init();
  const [s, setS] = useState<DeviceState>(current);
  useEffect(() => {
    const fn = (n: DeviceState) => setS(n);
    listeners.add(fn);
    setS(current);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return s;
}

export function updateDevice<K extends keyof DeviceState>(key: K, patch: Partial<DeviceState[K]>) {
  init();
  current = { ...current, [key]: { ...current[key], ...patch } };
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(current));
  listeners.forEach((l) => l(current));
}

export function pushHistory(entry: Omit<HistoryEntry, "id" | "ts">) {
  if (typeof window === "undefined") return;
  const list = readHistory();
  const next: HistoryEntry[] = [
    { ...entry, id: crypto.randomUUID(), ts: Date.now() },
    ...list,
  ].slice(0, 100);
  localStorage.setItem(HKEY, JSON.stringify(next));
}

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HKEY) || "[]");
  } catch {
    return [];
  }
}

export function useHistory() {
  const [list, setList] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    setList(readHistory());
    const t = setInterval(() => setList(readHistory()), 1500);
    return () => clearInterval(t);
  }, []);
  return list;
}
