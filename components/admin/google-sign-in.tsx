"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";

const GOOGLE_G = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C41.1 36.2 44 30.6 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

/**
 * "Continue with Google" — Supabase OAuth.
 * Requires the Google provider to be enabled in Supabase → Auth → Providers
 * (Client ID + Secret). Until then the button shows a helpful message.
 */
export function GoogleSignIn({ mode = "admin" }: { mode?: "admin" | "client" }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogle = async () => {
    setPending(true);
    setError(null);
    const db = createClient();
    try {
      const { data, error: authError } = await db.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${mode === "admin" ? "/admin" : "/client"}`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });

      if (authError || !data.url) {
        setPending(false);
        const msg =
          authError?.message?.toLowerCase().includes("provider") ||
          !data.url
            ? "Google sign-in isn't enabled yet. Ask the administrator to enable Google in Supabase → Authentication → Providers, then add your Google Client ID & Secret."
            : authError?.message ?? "Google sign-in failed. Please try again.";
        setError(msg);
        return;
      }

      trackEvent("admin_google_signin");
      router.push(data.url);
    } catch {
      setPending(false);
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={pending}
      >
        {GOOGLE_G}
        {pending ? "Redirecting to Google…" : "Continue with Google"}
      </Button>
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
