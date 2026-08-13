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
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const website = String(fd.get("website") || "");
    setPending(true);
    const res = await subscribeNewsletter({ email, website });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error || "Could not subscribe");
      return;
    }
    toast.success("Subscribed! Watch your inbox for tips & updates.");
    setEmail("");
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      {/* Honeypot — hidden from humans, traps bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      {/* Single combined card: email field + subscribe button inside one modern pill */}
      <div className="card-3d flex items-center gap-1.5 rounded-full border bg-card p-1.5 pl-4 transition-[border-color,box-shadow] focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
        <span className="shrink-0 text-muted-foreground">
          <AppIcon name="mail" size={16} />
        </span>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={compact ? "Email address" : "Enter your email"}
          className="input-flush h-10 min-w-0 flex-1 px-2"
          aria-label="Email address"
        />
        <Button
          type="submit"
          variant="gold"
          disabled={pending}
          className="h-10 shrink-0 rounded-full px-4 sm:px-5"
        >
          {pending ? (
            "…"
          ) : (
            <>
              Subscribe
              <AppIcon name="arrowRight" size={15} className="shrink-0" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
