import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { profile, loading, refresh } = useProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  useEffect(() => {
    setFirstName(profile?.first_name ?? "");
    setLastName(profile?.last_name ?? "");
  }, [profile]);

  if (!user) return null;

  const initials =
    [firstName, lastName]
      .map((s) => s.trim()[0])
      .filter(Boolean)
      .join("")
      .toUpperCase() || user.email?.[0]?.toUpperCase() || "?";

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
        },
        { onConflict: "user_id" },
      );
    setSaving(false);
    if (error) {
      toast.error("Failed to save", { description: error.message });
    } else {
      toast.success("Profile updated");
      refresh();
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large", { description: "Max 5MB" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error("Upload failed", { description: upErr.message });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updErr } = await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, avatar_url: pub.publicUrl },
        { onConflict: "user_id" },
      );
    setUploading(false);
    if (updErr) {
      toast.error("Failed to save avatar", { description: updErr.message });
      return;
    }
    toast.success("Photo updated");
    refresh();
  };

  return (
    <AppShell title="Profile">
      <section className="surface-card rounded-2xl border border-border p-5 mt-2 flex flex-col items-center">
        <div className="relative">
          <Avatar className="w-28 h-28 ring-2 ring-border">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="Avatar" />
            ) : null}
            <AvatarFallback className="text-2xl font-bold bg-muted">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 grid place-items-center w-10 h-10 rounded-full text-primary-foreground shadow-lg active:scale-95 disabled:opacity-60"
            style={{ background: "var(--gradient-primary)" }}
            aria-label="Change photo"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground truncate max-w-full">
          {user.email}
        </p>
      </section>

      <section className="surface-card rounded-2xl border border-border p-4 mt-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <UserIcon className="w-3.5 h-3.5" />
          Personal info
        </div>

        <label className="block text-xs text-muted-foreground mt-4 mb-1">First name</label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Your first name"
          className="w-full min-h-[48px] rounded-xl bg-muted border border-border px-3 text-sm"
        />

        <label className="block text-xs text-muted-foreground mt-3 mb-1">Last name</label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Your last name"
          className="w-full min-h-[48px] rounded-xl bg-muted border border-border px-3 text-sm"
        />

        <button
          onClick={save}
          disabled={saving || loading}
          className="mt-4 w-full min-h-[48px] rounded-xl font-semibold active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save changes
        </button>
      </section>
    </AppShell>
  );
}
