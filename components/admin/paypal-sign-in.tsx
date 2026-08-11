"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { getPaypalLoginUrl } from "@/lib/actions/auth-paypal";
import { trackEvent } from "@/lib/analytics";

const PAYPAL_LOGO = (
  <svg width="74" height="20" viewBox="0 0 120 33" aria-label="PayPal" role="img">
    <path
      fill="#FFFFFF"
      d="M45.6 4.2H33.2c-.6 0-1.1.4-1.2 1L29 22.8c-.1.5.3.9.8.9h4.2c.6 0 1.1-.4 1.2-1l.9-5.5c.1-.6.6-1 1.2-1h2.8c5.8 0 9.2-2.8 10.1-8.4.4-2.6-.1-4.7-1.7-6.1-1.4-1.3-3.6-1.8-5.9-1.8.1.1-.1.1 0 .2zm.9 7.7c-.5 3.4-3.4 3.4-6.2 3.4h-1.6l1.2-7.2c.1-.4.4-.7.8-.7h.7c1.9 0 3.7 0 4.6 1 .5.5.6 1.4.5 2.3v1.2zM61.5 15.3h-4.2c-.4 0-.8.3-.8.8l-.2 1.1-.3-.4c-1-1.4-3.6-1.9-6-1.9-5.6 0-10.4 4.3-11.3 10.1-.5 2.9.3 5.7 2.2 7.6 1.7 1.7 4.2 2.4 6.8 2.4 4.9 0 9.1-3.2 10.3-7.9h-.6c.5-2.4.3-4.5-.4-6 .1 0-.4-.2-.7-.4.2-.5.6-1.2.6-1.7l.2-1.1.2-.8c.1-.6-.3-1.1-.9-1.1.2 0 .1 0 .1 0zm-11.8 9.1c-.5 3-2.5 5-5.5 5-1.4 0-2.5-.4-3.3-1.2-.9-.9-1.2-2.2-.9-3.6.5-2.9 2.6-4.9 5.5-4.9 1.4 0 2.5.4 3.2 1.2.9.9 1.2 2.1 1 3.5zM83.2 4.2H70.9c-.6 0-1.1.4-1.2 1l-2.9 17.6c-.1.5.3.9.8.9h4.4c.6 0 1.1-.4 1.2-1l.8-4.8c.1-.6.6-1 1.2-1h2.8c5.8 0 9.2-2.8 10.1-8.4.4-2.6-.1-4.7-1.7-6.1-1.5-1.3-3.7-1.8-6-1.8.1.1-.1.1 0 .2zm.9 7.7c-.5 3.4-3.4 3.4-6.2 3.4h-1.6l1.2-7.2c.1-.4.4-.7.8-.7h.7c1.9 0 3.7 0 4.6 1 .5.5.6 1.4.5 2.3v1.2z"
    />
    <path
      fill="#FFFFFF"
      d="M99.2 15.3H95c-.4 0-.8.3-.8.8l-.2 1.1-.3-.4c-1-1.4-3.6-1.9-6-1.9-5.6 0-10.4 4.3-11.3 10.1-.5 2.9.3 5.7 2.2 7.6 1.7 1.7 4.2 2.4 6.8 2.4 4.9 0 9.1-3.2 10.3-7.9h-.6c.5-2.4.3-4.5-.4-6 .1 0-.4-.2-.7-.4.2-.5.6-1.2.6-1.7l.2-1.1.2-.8c.1-.6-.3-1.1-.9-1.1.2 0 .1 0 .1 0zm-11.8 9.1c-.5 3-2.5 5-5.5 5-1.4 0-2.5-.4-3.3-1.2-.9-.9-1.2-2.2-.9-3.6.5-2.9 2.6-4.9 5.5-4.9 1.4 0 2.5.4 3.2 1.2.9.9 1.2 2.1 1 3.5z"
    />
  </svg>
);

/**
 * "Log in with PayPal" — redirects to PayPal OAuth (OpenID Connect).
 * Works once the gateway (client id + secret) is configured.
 */
export function PayPalSignIn({ mode = "admin" }: { mode?: "admin" | "client" }) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handle = async () => {
    setPending(true);
    setError(null);
    const res = await getPaypalLoginUrl(mode);
    if (!res.ok) {
      setPending(false);
      setError(
        "PayPal sign-in isn't enabled yet. Configure the PayPal gateway (Client ID + Secret) in Settings first."
      );
      return;
    }
    trackEvent("paypal_signin");
    window.location.href = res.url;
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="w-full bg-[#003087] hover:bg-[#002868] text-white"
        onClick={handle}
        disabled={pending}
      >
        {pending ? "Redirecting to PayPal…" : PAYPAL_LOGO}
      </Button>
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
