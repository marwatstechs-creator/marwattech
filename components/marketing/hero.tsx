"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATS } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background decorations */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_0%,hsl(var(--brand)/0.12),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-40 size-72 rounded-full bg-gold/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-24 size-72 rounded-full bg-azure/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-28 lg:pt-24">
        {/* Copy */}
        <div className="space-y-7">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5 }}
          >
            <Badge variant="gold" className="gap-2 px-3 py-1 text-xs uppercase tracking-wide">
              <AppIcon name="sparkles" size={14} />
              Software & Web Development Company
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.08 }}
            className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            We build websites that{" "}
            <span className="text-primary">grow your business</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.16 }}
            className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Marwat Tech is a full-service digital agency — custom web
            development, ecommerce, mobile apps, UI/UX, SEO and AI solutions —
            engineered for speed, security and results.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Link
              href="/free-mockup"
              onClick={() => trackEvent("cta_click", { cta: "hero_free_mockup" })}
            >
              <Button size="lg" variant="gold" className="font-semibold">
                Get a Free Mockup
                <AppIcon name="arrowUpRight" size={18} />
              </Button>
            </Link>
            <Link
              href="/services"
              onClick={() => trackEvent("cta_click", { cta: "hero_services" })}
            >
              <Button size="lg" variant="outline" className="font-semibold">
                Explore Services
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.dl
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0.32 }}
            className="grid max-w-md grid-cols-4 gap-4 border-t pt-6"
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="order-2 text-xs text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="font-display order-1 text-2xl font-bold text-foreground">
                  {s.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mx-auto w-full max-w-lg lg:max-w-none"
        >
          <div className="relative overflow-hidden rounded-2xl border bg-card shadow-xl">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-3">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 flex-1 truncate rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                marwattech.com
              </span>
            </div>
            {/* Fake dashboard */}
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Website Performance
                  </span>
                  <Badge variant="gold">99/100</Badge>
                </div>
                <div className="flex h-24 items-end gap-2">
                  {[55, 72, 60, 85, 78, 95, 88, 100].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className={
                        i >= 5
                          ? "flex-1 rounded-t-md bg-primary"
                          : "flex-1 rounded-t-md bg-muted"
                      }
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  +38% traffic this month
                </p>
              </div>
              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Conversions
                  </span>
                  <Badge variant="default">↑ 24%</Badge>
                </div>
                <div className="flex items-center justify-center gap-3 py-3">
                  <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <AppIcon name="rocket" size={26} />
                  </span>
                  <div>
                    <p className="font-display text-2xl font-bold">4.9/5</p>
                    <p className="text-xs text-muted-foreground">client rating</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["SEO", "Ecommerce", "AI", "Mobile"].map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-background px-2 py-1 text-[11px] font-medium text-foreground/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating chips */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute -left-4 top-8 hidden rounded-xl border bg-card px-4 py-3 shadow-lg sm:flex sm:items-center sm:gap-3"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-gold/15 text-gold">
              <AppIcon name="sparkles" size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">Free Mockup</p>
              <p className="text-xs text-muted-foreground">See your idea first</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75 }}
            className="absolute -bottom-5 -right-2 hidden rounded-xl border bg-card px-4 py-3 shadow-lg sm:flex sm:items-center sm:gap-3"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-azure/15 text-azure">
              <AppIcon name="ai" size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">AI Solutions</p>
              <p className="text-xs text-muted-foreground">24/7 smart support</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
