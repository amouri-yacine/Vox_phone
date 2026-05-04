import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { getEspUrl, setEspUrl, pingEsp, normalizeEspUrl } from "@/lib/socket";
import { LogOut, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [url, setUrl] = useState("");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    setUrl(getEspUrl());
  }, []);

  const check = async () => {
    setChecking(true);
    const ok = await pingEsp();
    setConnected(ok);
    setChecking(false);
  };

  useEffect(() => {
    if (user) check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return (
    <AppShell title="Settings">
      <Link
        to="/profile"
        className="surface-card rounded-2xl border border-border p-4 mt-2 flex items-center justify-between active:scale-[0.99]"
      >
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Account</p>
          <p className="font-semibold mt-1 truncate">{user.email}</p>
          <p className="text-xs text-primary mt-1">Edit profile →</p>
        </div>
      </Link>

      <section className="surface-card rounded-2xl border border-border p-4 mt-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">ESP8266 IR Blaster</p>

        <div className="flex items-center gap-3 mt-2">
          {connected === null ? (
            <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : connected ? (
            <Wifi className="w-5 h-5" style={{ color: "var(--accent)" }} />
          ) : (
            <WifiOff className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="font-semibold">
            {connected === null ? "Checking…" : connected ? "Online" : "Offline"}
          </span>
        </div>

        <label className="block text-xs text-muted-foreground mt-4 mb-1">Device URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => {
            try {
              setUrl(normalizeEspUrl(url));
            } catch {
              // Keep the typed value so Save can show a clear error.
            }
          }}
          placeholder="http://192.168.100.28:3001"
          className="w-full min-h-[48px] rounded-xl bg-muted border border-border px-3 font-mono text-sm"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
        />

        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => {
              try {
                const normalized = setEspUrl(url);
                setUrl(normalized);
                toast.success("Saved", { description: normalized });
                check();
              } catch (err) {
                toast.error("Invalid device URL", {
                  description: err instanceof Error ? err.message : "Use http://<pi-ip>:3001",
                });
              }
            }}
            className="min-h-[48px] rounded-xl font-semibold active:scale-[0.98]"
            style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
          >
            Save
          </button>
          <button
            onClick={check}
            disabled={checking}
            className="min-h-[48px] rounded-xl bg-card border border-border font-semibold active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            Test
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground/70 mt-3 leading-relaxed">
          Enter the Raspberry Pi URL (e.g. <code>http://192.168.100.28:3001</code>).
          Phone and Pi must share the same Wi-Fi.
        </p>
      </section>

      <button
        onClick={async () => {
          await signOut();
          nav({ to: "/login" });
        }}
        className="mt-6 w-full min-h-[52px] rounded-2xl bg-card border border-border font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <LogOut className="w-5 h-5" />
        Sign out
      </button>
    </AppShell>
  );
}
