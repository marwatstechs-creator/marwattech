"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/app-icon";
import { GoogleSignIn } from "@/components/admin/google-sign-in";
import { GoogleOneTapLoader } from "@/components/admin/google-one-tap-loader";
import { PayPalSignIn } from "@/components/admin/paypal-sign-in";
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

export default function ClientLoginPage() {
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
      setError("Invalid email or password.");
      setPending(false);
      return;
    }

    toast.success("Welcome to your dashboard!");
    router.push("/client");
    router.refresh();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "google" || err === "google_no_email") {
      toast.error(
        "Google sign-in could not be completed. Check your Client ID + Secret and the redirect URI in Settings → Google Sign-In."
      );
    } else if (err === "paypal" || err === "paypal_no_email") {
      toast.error(
        "PayPal sign-in could not be completed. Make sure the PayPal gateway is configured and Log in with PayPal is enabled for your app."
      );
    }
  }, []);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">Client Portal</CardTitle>
        <CardDescription>
          Sign in to view your projects, payments, tickets and courses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleOneTapLoader mode="client" />
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
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

        <GoogleSignIn mode="client" />
        <PayPalSignIn mode="client" />

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/client/register" className="font-medium text-primary hover:underline">Create one</Link>
        </p>
      </CardContent>
    </Card>
  );
}
