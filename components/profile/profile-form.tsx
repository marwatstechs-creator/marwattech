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

export function ProfileForm({
  user,
  hasPassword = true,
}: {
  user: { email?: string; full_name: string | null; avatar_url?: string | null };
  hasPassword?: boolean;
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
