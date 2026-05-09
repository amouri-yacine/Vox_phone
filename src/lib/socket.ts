// HTTP transport for the ESP8266 IR blaster.
// The ESP exposes:
//   POST /command   body: {"cmd":"v+"}
//   GET  /ping
//
// The base URL is stored in localStorage so the user can change it from
// the Settings screen without rebuilding the app. It falls back to the
// VITE_ESP_URL build-time env var, then to a sensible default.

const URL_KEY = "smarthome-esp-url-v1";
const DEFAULT_PI_PORT = "3001";

function isPrivateIp(hostname: string) {
  return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);
}

export function normalizeEspUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) throw new Error("Device URL is empty");
  if (/^ngrok\s+/i.test(trimmed)) throw new Error("Paste the https ngrok forwarding URL, not the ngrok command");

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Device URL must start with http:// or https://");
  }

  if (parsed.protocol === "http:" && isPrivateIp(parsed.hostname) && !parsed.port) {
    parsed.port = DEFAULT_PI_PORT;
  }

  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  return parsed.origin + parsed.pathname;
}

function defaultUrl(): string {
  return (
    (import.meta.env.VITE_ESP_URL as string | undefined) ??
    (import.meta.env.VITE_SOCKET_URL as string | undefined) ??
    "http://192.168.100.28:3001"
  );
}

export function getEspUrl(): string {
  if (typeof window === "undefined") return defaultUrl();
  const stored = localStorage.getItem(URL_KEY);
  if (!stored) return defaultUrl();
  try {
    return normalizeEspUrl(stored);
  } catch {
    return defaultUrl();
  }
}

export function setEspUrl(url: string): string {
  const normalized = normalizeEspUrl(url);
  if (typeof window !== "undefined") {
    localStorage.setItem(URL_KEY, normalized);
  }
  return normalized;
}

export async function sendCommand(device: "ac" | "tv", command: string) {
  const base = getEspUrl();
  const url = `${base.replace(/\/+$/, "")}/command`;
  // The ESP8266 firmware expects every command prefixed by its device:
  //   ac_on, ac_22, ac_fan_high, tv_p, tv_v+, tv_1, ...
  const prefix = `${device}_`;
  const cmd = command.startsWith(prefix) ? command : `${prefix}${command}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd }),
      // ESP8266 is on LAN; keep timeout short via AbortController
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json().catch(() => ({}));
  } catch (err) {
    console.warn("[esp] command failed:", command, err);
    throw err;
  }
}

export async function pingEsp(): Promise<boolean> {
  const base = getEspUrl();
  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/ping`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
