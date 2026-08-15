"use client";

import { useEffect, useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "google" || err === "google_no_email") {
      toast.error("Google sign-in could not be completed. Please try again.");
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setPending(false);
      return;
    }

    const db = createClient();
    // Point the confirmation email's link at the production app — otherwise
    // Supabase falls back to the configured SITE_URL (e.g. localhost:3000).
    const origin = window.location.origin;
    const { error: signUpError } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${origin}/auth/confirm`,
      },
    });

    if (signUpError) {
      // Generic message — don't leak whether the account already exists.
      setError("Could not create your account. If you already have an account, sign in instead.");
      setPending(false);
      return;
    }

    toast.success("Account created! Check your email to confirm.");
    router.push("/client/login");
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">Create Account</CardTitle>
        <CardDescription>
          Sign up to access your projects, payments, tickets and courses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleSignIn mode="client" />
        <GitHubSignIn mode="client" />
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={pending} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Create Account"}
            {!pending && <AppIcon name="arrowRight" size={16} className="ml-2" />}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/client/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
