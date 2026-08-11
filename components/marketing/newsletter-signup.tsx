"use client";

import * as React from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/lib/actions/marketing";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    const res = await subscribeNewsletter({ email });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not subscribe");
      return;
    }
    toast.success("Subscribed! Watch your inbox for tips & updates.");
    setEmail("");
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm gap-2">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <AppIcon name="mail" size={15} />
        </span>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={compact ? "Email address" : "Enter your email"}
          className="pl-9"
          aria-label="Email address"
        />
      </div>
      <Button type="submit" variant="gold" disabled={pending} className="shrink-0">
        {pending ? "…" : "Subscribe"}
      </Button>
    </form>
  );
}
