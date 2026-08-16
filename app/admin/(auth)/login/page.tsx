"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/app-icon";
import { GoogleSignIn } from "@/components/admin/google-sign-in";
import { GitHubSignIn } from "@/components/admin/github-sign-in";
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

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const db = createClient();
    const { error: authError } = await db.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password. Please try again.");
      setPending(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/admin");
    router.refresh();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "auth_callback") {
      toast.error(
        "Google sign-in could not be completed."
      );
    } else if (err === "google" || err === "google_no_email") {
      toast.error(
        "Google sign-in could not be completed. Check your Client ID + Secret and the redirect URI in Settings → Google Sign-In."
      );
    } else if (err === "github" || err === "github_no_email") {
      toast.error(
        "GitHub sign-in could not be completed. Check your GitHub App Client ID + Secret and the Redirect URI in Settings → GitHub Sign-In."
      );
    }
  }, []);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">Admin Login</CardTitle>
        <CardDescription>
          Sign in to manage your website content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@marwattech.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <div className="flex justify-end">
              <Link
                href="/auth/reset-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              "Signing in…"
            ) : (
              <>
                <AppIcon name="login" size={16} />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-3">
          <GoogleSignIn mode="admin" />
          <GitHubSignIn mode="admin" />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Authorized staff only. Contact the administrator if you need access.
        </p>
      </CardContent>
    </Card>
  );
}
