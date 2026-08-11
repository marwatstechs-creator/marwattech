"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Email-confirmation landing page (the `emailRedirectTo` target used by the
 * signup confirmation email). Completes the session when tokens are present,
 * otherwise shows a "confirmed — sign in" state so the flow never dead-ends.
 */
export default function ConfirmEmailPage() {
  const router = useRouter();
  const [working, setWorking] = useState(true);

  useEffect(() => {
    const db = createClient();
    (async () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await db.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          router.push("/client");
          router.refresh();
          return;
        }
      }
      // No session tokens (stale/already-handled link) — just confirm.
      setWorking(false);
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Email confirmed</CardTitle>
          <CardDescription>
            {working ? "Confirming your email…" : "Your email address is verified."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {working ? (
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <AppIcon name="refresh" size={22} className="animate-spin" />
            </span>
          ) : (
            <>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Thanks — your email is verified. You can now sign in.
              </p>
              <Button asChild className="w-full">
                <Link href="/client/login">Sign in to your dashboard</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
