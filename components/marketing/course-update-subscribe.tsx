"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { subscribeCourseUpdates } from "@/lib/actions/course-notifications";

/**
 * Public opt-in form for Course Update Notifications (daily digest).
 * Uses a honeypot field + explicit submit = explicit consent.
 */
export function CourseUpdateSubscribe() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast("Enter your email", { description: "We need an email to send updates to." });
      return;
    }
    setLoading(true);
    const res = await subscribeCourseUpdates({ email, website });
    setLoading(false);
    if (res.ok) {
      toast("You're subscribed! 🎉", {
        description:
          "We'll email you a daily digest whenever a course you follow gets updated. No spam, unsubscribe anytime.",
      });
      setEmail("");
    } else {
      toast("Something went wrong", {
        description: res.error || "Please try again with a valid email.",
      });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-gold/10 to-azure/10 p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(116,100,198,0.10),transparent)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-4 rotate-12 text-gold opacity-[0.12]"
      >
        <AppIcon name="bell" size={120} />
      </span>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="icon-3d-tile grid size-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <AppIcon name="bell" size={22} />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold leading-snug sm:text-xl">
              Get course update notifications 📬
            </h3>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a <strong>daily evening digest</strong>{" "}
              whenever a course you&apos;re following gets new lessons, updated content or new
              resources. No spam — only useful updates, and you can unsubscribe anytime.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row lg:shrink-0">
          {/* Honeypot — hidden from users, catches bots */}
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="h-11 w-full rounded-full border bg-background px-4 text-sm outline-none ring-primary/30 focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-3d-gold inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60"
          >
            <AppIcon name="bell" size={15} />
            {loading ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      </div>
    </div>
  );
}
