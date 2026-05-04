import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import voxLogo from "@/assets/vox-logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) nav({ to: "/" });
  }, [loading, user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (res.error) setErr(res.error);
    else if (mode === "up") setErr("Check your email to confirm, then sign in.");
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background px-6 safe-top">
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
        <div className="mb-10 text-center">
          <img
            src={voxLogo}
            alt="VOX logo"
            className="mx-auto w-44 h-44 object-contain mb-2 drop-shadow-[0_0_40px_rgba(56,189,248,0.4)]"
          />
          <h1 className="text-3xl font-bold tracking-tight">{mode === "in" ? "Welcome to VOX" : "Join VOX"}</h1>
          <p className="text-muted-foreground mt-2 text-sm">Control your devices with your voice.</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full min-h-[52px] rounded-2xl bg-card border border-border px-5 text-base outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            className="w-full min-h-[52px] rounded-2xl bg-card border border-border px-5 text-base outline-none focus:border-primary"
          />
          {err && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{err}</p>
          )}
          <button
            disabled={busy}
            className="w-full min-h-[52px] rounded-2xl font-semibold text-primary-foreground active:scale-[0.98] transition disabled:opacity-60"
            style={{ background: "var(--gradient-primary)" }}
          >
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setErr(null);
            setBusy(true);
            const res = await signIn("demo@vox.app", "VoxDemo!2026#Smart");
            setBusy(false);
            if (res.error) setErr(res.error);
          }}
          className="mt-4 w-full min-h-[52px] rounded-2xl font-semibold border border-border bg-card active:scale-[0.98] transition disabled:opacity-60"
        >
          🎭 Connexion démo
        </button>

        <button
          onClick={() => {
            setErr(null);
            setMode((m) => (m === "in" ? "up" : "in"));
          }}
          className="mt-6 text-sm text-muted-foreground text-center w-full min-h-[44px]"
        >
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>

        <Link to="/" className="mt-2 text-xs text-muted-foreground/60 text-center min-h-[44px] grid place-items-center">
          Back
        </Link>
      </div>
    </div>
  );
}
