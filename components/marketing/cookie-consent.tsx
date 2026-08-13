"use client";

import { useEffect, useState } from "react";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";

/** Lightweight cookie-consent banner (localStorage-backed). */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!localStorage.getItem("mt-cookie-consent")) {
        t = setTimeout(() => setVisible(true), 1600);
      }
    } catch {
      // ignore
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, []);

  const decide = (value: string) => {
    try {
      localStorage.setItem("mt-cookie-consent", value);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4">
      <div className="card-3d mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl border bg-card p-4 shadow-2xl sm:flex-row sm:items-center">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <AppIcon name="info" size={20} />
        </span>
        <p className="flex-1 text-sm text-foreground/80">
          We use cookies to improve your experience and analyze traffic. By continuing
          you agree to our{" "}
          <a href="/privacy-policy" className="font-semibold text-primary underline">
            privacy policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => decide("declined")}>
            Decline
          </Button>
          <Button variant="gold" size="sm" onClick={() => decide("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
