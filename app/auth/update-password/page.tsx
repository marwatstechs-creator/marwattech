"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Password recovery landing page.
 * The Supabase reset email points here with a `#access_token` + `#refresh_token`
 * hash — we exchange it for a session, then let the user set a new password.
 */
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = createClient();
    (async () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (!accessToken || !refreshToken) {
        setError("This reset link is invalid or has expired. Request a new one.");
        return;
      }
      const { error: sessionError } = await db.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        setError("This reset link is invalid or has expired. Request a new one.");
        return;
      }
      window.history.replaceState(null, "", window.location.pathname);
      setReady(true);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setPending(true);
    const db = createClient();
    const { error: updateError } = await db.auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    toast.success("Password updated. You can now sign in.");
    setReady(false);
    setDone(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Choose a new password</CardTitle>
          <CardDescription>
            Pick a strong password you haven&apos;t used before.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/reset-password">Request a new link</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Password updated successfully!
              </p>
              <div className="grid gap-2">
                <Button asChild className="w-full">
                  <Link href="/client/login">Sign in to the client portal</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/login">Sign in to admin</Link>
                </Button>
              </div>
            </div>
          ) : ready ? (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Updating…" : "Update password"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 py-6 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <AppIcon name="refresh" size={22} className="animate-spin" />
              </span>
              <p className="text-sm text-muted-foreground">Preparing your reset…</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
