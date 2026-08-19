"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { AppIcon } from "@/components/app-icon";
import { fadeUp, staggerContainer } from "./pricing-anim";

export function PricingCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.99 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-foreground px-6 py-14 text-center text-background sm:px-12"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[120%] -translate-x-1/2 opacity-30"
          style={{ background: "radial-gradient(closest-side, var(--color-primary), transparent)" }}
        />
        <motion.div
          variants={staggerContainer(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="relative"
        >
          <motion.h2 variants={fadeUp()} className="font-display mx-auto max-w-lg text-3xl font-bold leading-tight sm:text-4xl">
            Vetted talent, <span className="text-muted-foreground">rapidly matched,</span>{" "}
            <span className="text-primary">radically priced.</span>
          </motion.h2>
          <motion.p variants={fadeUp(0.05)} className="mx-auto mt-4 max-w-md text-sm text-background/70">
            The best value for developers on the web.
          </motion.p>
          <motion.div variants={fadeUp(0.1)} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              Get Matched{" "}
              <AppIcon name="arrowRight" size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex h-12 items-center rounded-full border border-background/20 px-6 text-sm font-semibold transition-colors hover:bg-background/10"
            >
              See our work
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
