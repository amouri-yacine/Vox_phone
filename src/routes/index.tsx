import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { DeviceCard } from "@/components/DeviceCard";
import { useDevices, updateDevice } from "@/lib/devices-store";
import { useProfile, displayName } from "@/lib/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Snowflake, Tv, Activity, Zap, Mic } from "lucide-react";
import { toast } from "sonner";
import voxLogo from "@/assets/vox-logo.png";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const devices = useDevices();
  const { profile } = useProfile();

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-dvh grid place-items-center px-6 text-center">
        <div className="space-y-6 max-w-sm">
          <img
            src={voxLogo}
            alt="VOX logo"
            className="mx-auto w-40 h-40 object-contain drop-shadow-[0_0_40px_oklch(0.72_0.18_240/0.55)]"
          />
          <p className="text-muted-foreground">Your voice. Your comfort.</p>
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-2xl px-5 min-h-[52px] font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            Get started
          </Link>
        </div>
      </div>
    );
  }

  const activeCount = (devices.ac.on ? 1 : 0) + (devices.tv.on ? 1 : 0);
  const fallbackName = user.email?.split("@")[0] ?? "there";
  const username = displayName(profile, fallbackName);
  const initials =
    [profile?.first_name, profile?.last_name]
      .map((s) => s?.trim()[0])
      .filter(Boolean)
      .join("")
      .toUpperCase() || fallbackName[0]?.toUpperCase() || "?";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Good night";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const renameDevice = (key: "ac" | "tv", next: string) => {
    updateDevice(key, { name: next } as never);
    toast.success("Device renamed", { description: `Now called "${next}"` });
  };

  return (
    <AppShell title={`${greeting}, ${username}`}>
      <div className="-mt-2 mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Welcome back to your home</p>
        <Link to="/profile" aria-label="Open profile">
          <Avatar className="w-10 h-10 ring-2 ring-border">
            {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="Avatar" /> : null}
            <AvatarFallback className="text-xs font-bold bg-muted">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* VOX Hero Logo */}
      <div className="surface-card relative overflow-hidden rounded-3xl border border-border p-5 mb-5">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="relative flex items-center gap-4">
          <div className="shrink-0">
            <img
              src={voxLogo}
              alt="VOX"
              className="w-20 h-20 object-contain drop-shadow-[0_8px_24px_oklch(0.72_0.18_240/0.55)]"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              <Mic className="w-3 h-3" />
              VOX
            </div>
            <h2 className="mt-1 text-lg font-bold leading-tight">
              Your voice. Your home.
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Speak a command, your devices listen.
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="surface-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Activity className="w-3.5 h-3.5" />
            Active
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold">{activeCount}</span>
            <span className="text-xs text-muted-foreground">/ 2</span>
          </div>
        </div>
        <div className="surface-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Zap className="w-3.5 h-3.5" />
            Status
          </div>
          <div className="mt-1 text-sm font-semibold">
            {activeCount === 0 ? "All idle" : activeCount === 2 ? "All on" : "Partial"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Your devices
        </h2>
        <span className="text-[11px] text-muted-foreground">Tap pencil to rename</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DeviceCard
          to="/ac"
          name={devices.ac.name}
          status={devices.ac.on ? `${devices.ac.temp}°C cooling` : "Standby"}
          icon={Snowflake}
          on={devices.ac.on}
          onRename={(n) => renameDevice("ac", n)}
        />
        <DeviceCard
          to="/tv"
          name={devices.tv.name}
          status={devices.tv.on ? `Vol ${devices.tv.volume}` : "Standby"}
          icon={Tv}
          on={devices.tv.on}
          onRename={(n) => renameDevice("tv", n)}
        />
      </div>
    </AppShell>
  );
}

void redirect;
