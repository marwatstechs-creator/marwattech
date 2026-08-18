"use client";

import { useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How is Marwat Tech so affordable?",
    a: "We work with a vetted global talent pool and a lean, outcome-focused process. You pay published hourly rates with no recruiter fees, agency markups or brand tax — senior-level skill at a fraction of the usual cost.",
  },
  {
    q: "How does pricing work?",
    a: "Pick a tier and an engagement (hours per week). You're billed hourly for the time you use, at the published rate for your tier. No setup fees, no hidden charges, and you can adjust hours as your project grows.",
  },
  {
    q: "What happens if the developer isn't a good fit?",
    a: "We match you with a dedicated developer vetted for your stack. If it's not the right fit, we swap you out or re-match you — free, no questions.",
  },
  {
    q: "What stack can you cover?",
    a: "Web development (Next.js, React, WordPress), e-commerce, mobile apps, SEO, AI/automation, UI/UX design and ongoing maintenance — across our Associate, Mid-Senior and Senior tiers.",
  },
  {
    q: "How fast can I get started?",
    a: "We typically match you within days of your first call. Tell us what you need, we scope the work together and match you with the right developer for your stack and budget.",
  },
  {
    q: "Can I scale up or down later?",
    a: "Yes. Adjust hours week to week, add more developers, or pause — the engagement flexes with your needs.",
  },
];

export function PricingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <span className="size-2 rounded-[2px] bg-primary" />
              FAQ
            </span>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Got a question? <span className="text-muted-foreground">We&apos;ve got answers.</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/contact"
              className="inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors hover:bg-accent-hover"
            >
              <AppIcon name="chat" size={16} /> Talk to us
            </a>
            <a
              href="mailto:hello@marwattech.com"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <AppIcon name="mailSend" size={16} /> Email us
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border bg-card">
              <button
                type="button"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
                className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-display text-base font-semibold">{f.q}</span>
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border bg-background transition-transform",
                    open === i && "rotate-45"
                  )}
                >
                  <AppIcon name="plus" size={16} />
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out",
                  open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
