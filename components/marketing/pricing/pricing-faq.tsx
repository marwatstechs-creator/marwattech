"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";
import { EASE, fadeUp, staggerContainer } from "./pricing-anim";

type FaqCategory = "pricing" | "talent" | "working" | "getting-started";

const CATEGORIES: { id: FaqCategory; label: string }[] = [
  { id: "pricing", label: "Pricing & Value" },
  { id: "talent", label: "Talent, Vetting & Quality" },
  { id: "working", label: "Working With Your Developer" },
  { id: "getting-started", label: "Getting Started" },
];

const FAQS: Record<FaqCategory, { q: string; a: string }[]> = {
  pricing: [
    {
      q: "How is Marwat Tech so affordable?",
      a: "We work with a vetted global talent pool and a lean, outcome-focused process. You pay published hourly rates with no recruiter fees, agency markups or brand tax — senior-level skill at a fraction of the usual cost.",
    },
    {
      q: "How does pricing work?",
      a: "Pick a tier and an engagement (hours per week). You're billed hourly for the time you use, at the published rate for your tier. No setup fees, no hidden charges, and you can adjust hours as your project grows.",
    },
    {
      q: "Are there any hidden fees?",
      a: "None. The published rate is the rate you pay. There are no recruiter fees, no platform markups and no surprise line items — the calculator above shows your true all-in cost.",
    },
  ],
  talent: [
    {
      q: "How are developers vetted?",
      a: "Every developer is hand-picked for your stack. We review work history, run technical assessments and interviews, and only put candidates in front of you who clear our quality bar — most don't make it through.",
    },
    {
      q: "What happens if the developer isn't a good fit?",
      a: "We match you with a dedicated developer vetted for your stack. If it's not the right fit, we swap you out or re-match you — free, no questions.",
    },
    {
      q: "What stack can you cover?",
      a: "Web development (Next.js, React, WordPress), e-commerce, mobile apps, SEO, AI/automation, UI/UX design and ongoing maintenance — across our Associate, Mid-Senior and Senior tiers.",
    },
  ],
  working: [
    {
      q: "How do we work together?",
      a: "You get a dedicated developer on your stack, with clear hourly billing and time tracking built in. You're kept in the loop with regular updates, and you can pause or cancel anytime.",
    },
    {
      q: "Can I scale up or down later?",
      a: "Yes. Adjust hours week to week, add more developers, or pause — the engagement flexes with your needs.",
    },
    {
      q: "What if I have a 14-day trial concern?",
      a: "The first 14 days are risk-free. If your developer isn't the right fit within the trial, you don't pay — we re-match you or refund every cent.",
    },
  ],
  "getting-started": [
    {
      q: "How fast can I get started?",
      a: "We typically match you within days of your first call. Tell us what you need, we scope the work together and match you with the right developer for your stack and budget.",
    },
    {
      q: "Do I need a technical background?",
      a: "No. We help scope the build, draft milestones and phase the work so you hire exactly the right fit — guidance for non-technical founders is part of the service.",
    },
    {
      q: "How do I get matched?",
      a: "Start with the free mockup form or a quick call. We'll understand your project, match you with the right developer and get you building on a 14-day risk-free trial.",
    },
  ],
};

function FaqItem({ f, i, open, onToggle }: { f: { q: string; a: string }; i: number; open: boolean; onToggle: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
      className={cn(
        "overflow-hidden rounded-2xl border bg-card transition-colors duration-300",
        open ? "border-primary/40 shadow-lg shadow-primary/5" : "hover:border-primary/25"
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-display text-base font-semibold transition-colors group-hover:text-primary">{f.q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border transition-colors",
            open ? "border-primary bg-primary text-primary-foreground" : "border bg-background"
          )}
        >
          <AppIcon name="plus" size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PricingFaq() {
  const [cat, setCat] = useState<FaqCategory>("pricing");
  const [open, setOpen] = useState<number | null>(0);
  const items = FAQS[cat];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <motion.div
            variants={staggerContainer(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="flex flex-col gap-4"
          >
            <motion.span
              variants={fadeUp()}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary"
            >
              <span className="size-2 rounded-[2px] bg-primary" />
              FAQ
            </motion.span>
            <motion.h2 variants={fadeUp(0.05)} className="font-display text-3xl font-bold sm:text-4xl">
              Got a question? <span className="text-muted-foreground">We&apos;ve got answers.</span>
            </motion.h2>
            <motion.p variants={fadeUp(0.1)} className="text-sm text-muted-foreground">
              Pick a topic, or reach out directly — a real human replies fast.
            </motion.p>
          </motion.div>

          {/* Contact buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
            className="flex flex-wrap items-center gap-3"
          >
            <a
              href="https://wa.me/923104580297"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent-hover"
            >
              <AppIcon name="whatsapp" size={16} className="text-emerald-500" /> WhatsApp
            </a>
            <a
              href="mailto:contact@marwattech.com"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
            >
              <AppIcon name="mailSend" size={16} /> Email us
            </a>
          </motion.div>
        </div>

        <div>
          {/* Category tabs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-5 flex flex-wrap gap-2"
          >
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={cat === c.id}
                onClick={() => {
                  setCat(c.id);
                  setOpen(0);
                }}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[13px] font-semibold transition-colors duration-300",
                  cat === c.id ? "text-primary-foreground" : "text-foreground/70 hover:bg-accent-hover hover:text-foreground"
                )}
              >
                {cat === c.id && (
                  <motion.span
                    layoutId="faq-tab"
                    transition={{ duration: 0.4, ease: EASE }}
                    className="absolute inset-0 rounded-full bg-primary shadow-md shadow-primary/25"
                  />
                )}
                <span className="relative">{c.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Accordion */}
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex flex-col gap-3"
              >
                {items.map((f, i) => (
                  <FaqItem key={f.q} f={f} i={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
