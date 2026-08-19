"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changePassword,
  updateProfileName,
  uploadProfileAvatar,
} from "@/lib/actions/profile";
import { initials } from "@/lib/utils";

const GOOGLE_MARK = (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C41.1 36.2 44 30.6 44 24c0-1.3-.1-2.6-.4-3.9z" />
  </svg>
);

const GITHUB_MARK = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
    />
  </svg>
);

function SignInBadge({ method }: { method: "google" | "github" | "email" }) {
  if (method === "google") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium shadow-sm">
        {GOOGLE_MARK}
        Signed in with Google
      </span>
    );
  }
  if (method === "github") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm">
        {GITHUB_MARK}
        Signed in with GitHub
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium shadow-sm">
      <img
        src="/assets/logo-light-square.svg"
        alt=""
        className="size-4 rounded dark:hidden"
      />
      <img
        src="/assets/logo-dark-square.svg"
        alt=""
        className="hidden size-4 rounded dark:block"
      />
      Marwat Tech account
    </span>
  );
}

export function ProfileForm({
  user,
  hasPassword = true,
  signInMethod = "email",
}: {
  user: { email?: string; full_name: string | null; avatar_url?: string | null };
  hasPassword?: boolean;
  signInMethod?: "google" | "github" | "email";
}) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState(user.full_name ?? "");
  const [avatar, setAvatar] = React.useState<string | null>(user.avatar_url ?? null);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [curPw, setCurPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [pwPending, setPwPending] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await uploadProfileAvatar(fd);
      if (res.ok) {
        if (res.url) setAvatar(res.url);
        toast.success("Profile picture updated");
      } else {
        toast.error(res.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed — try a smaller image (max 4 MB).");
    } finally {
      setUploading(false);
      e.target.value = "";
      router.refresh();
    }
  };

  const onSave = async () => {
    const name = fullName.trim();
    if (!name) {
      toast.error("Name can't be empty");
      return;
    }
    setSaving(true);
    const res = await updateProfileName({ fullName: name });
    setSaving(false);
    if (res.ok) {
      toast.success("Profile updated");
      router.refresh();
    } else {
      toast.error(res.error || "Could not save");
    }
  };

  const onChangePassword = async () => {
    if (hasPassword && !curPw) return toast.error("Enter your current password.");
    if (newPw.length < 8) {
      return toast.error("New password must be at least 8 characters.");
    }
    if (newPw !== confirmPw) return toast.error("New passwords don't match.");
    setPwPending(true);
    const res = await changePassword({
      currentPassword: hasPassword ? curPw : undefined,
      newPassword: newPw,
    });
    setPwPending(false);
    if (!res.ok) return toast.error(res.error || "Could not change password");
    toast.success(hasPassword ? "Password updated" : "Password set");
    setCurPw("");
    setNewPw("");
    setConfirmPw("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Avatar card */}
      <Card className="card-3d h-fit">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <Avatar className="size-28 ring-2 ring-primary/20">
            {avatar ? (
              <AvatarImage src={avatar} alt={fullName || "User"} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
                {initials(fullName || "U")}
              </AvatarFallback>
            )}
          </Avatar>

          <SignInBadge method={signInMethod} />

          <div className="flex flex-col items-center gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickAvatar}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <AppIcon name="refresh" size={14} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <AppIcon name="upload" size={14} />
                  Change photo
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              JPG or PNG, max 4 MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Details + password cards */}
      <div className="flex flex-col gap-6">
      <Card className="card-3d">
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="grid gap-1.5">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={user.email ?? ""}
              disabled
              readOnly
              className="opacity-70"
            />
            <p className="text-xs text-muted-foreground">
              Your email is tied to your account and can&apos;t be changed here.
            </p>
          </div>

          <div className="flex items-center gap-3 border-t pt-5">
            <Button onClick={onSave} disabled={saving} className="btn-3d">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change password card */}
      <Card className="card-3d">
        <CardContent className="flex flex-col gap-4 p-6">
          <div>
            <h3 className="font-medium">Change password</h3>
            <p className="text-xs text-muted-foreground">
              {hasPassword
                ? "Use your current password to set a new one."
                : "You signed in with Google — no password needed. You can set one below if you like."}
            </p>
          </div>

          {hasPassword && (
            <div className="grid gap-1.5">
              <Label htmlFor="pw-current">Current password</Label>
              <Input
                id="pw-current"
                type="password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="pw-new">New password</Label>
            <Input
              id="pw-new"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters with letters & numbers"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pw-confirm">Confirm new password</Label>
            <Input
              id="pw-confirm"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter new password"
            />
          </div>

          <div className="flex items-center gap-3 border-t pt-4">
            <Button onClick={onChangePassword} disabled={pwPending} className="btn-3d">
              {pwPending ? "Saving…" : hasPassword ? "Update password" : "Set password"}
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
