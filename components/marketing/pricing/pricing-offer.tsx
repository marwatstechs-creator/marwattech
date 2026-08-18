"use client";

import { motion } from "framer-motion";

import { AppIcon } from "@/components/app-icon";
import { GuaranteeSeal } from "@/components/marketing/guarantee-seal";
import { rise, staggerContainer } from "./pricing-anim";

const OFFER = [
  {
    icon: "code" as const,
    title: "A dedicated, pre-vetted engineer",
    desc: "Sourced and matched to your stack — Next.js, React, WordPress, e-commerce, SEO, AI and more.",
  },
  {
    icon: "refresh" as const,
    title: "Free replacements, guaranteed",
    desc: "Not the right fit? Swap developers in or out, or we re-match you. No fees, ever.",
  },
  {
    icon: "eye" as const,
    title: "Radical transparency",
    desc: "Clear hourly billing with time tracking built in — you always know where your budget goes.",
  },
  {
    icon: "target" as const,
    title: "100% focus on your project",
    desc: "Your developer works on your stack and your goals — no shared teams or split attention.",
  },
  {
    icon: "chart" as const,
    title: "Guidance for non-technical founders",
    desc: "We help scope the build, draft the milestones and phase the work so you hire the right fit.",
  },
  {
    icon: "shield" as const,
    title: "No recruiter fees, no brand tax",
    desc: "The published rate is the rate you pay. Compare us against any agency or marketplace.",
  },
];

export function PricingOffer() {
  return (
    <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pb-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground sm:p-12 lg:p-14">
        {/* Ambient glows */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-gold/20 blur-3xl" />

        {/* Rotating seal — tucked in the top-right of the offer */}
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 hidden -rotate-6 opacity-90 md:block">
          <GuaranteeSeal className="h-44 w-44 text-primary-foreground" />
        </div>

        <div className="relative flex flex-col items-center gap-3 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-90"
          >
            <span className="size-1.5 rounded-full bg-primary-foreground" />
            The Offer
            <span className="size-1.5 rounded-full bg-primary-foreground" />
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-3xl font-bold sm:text-4xl"
          >
            Everything you get.
          </motion.h2>
        </div>

        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {OFFER.map((o) => (
            <motion.div
              key={o.title}
              variants={rise()}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group relative overflow-hidden rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur transition-colors duration-300 hover:bg-primary-foreground/15"
            >
              {/* Hover sheen */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 translate-y-full bg-gradient-to-b from-transparent to-primary-foreground/10 transition-transform duration-500 group-hover:translate-y-0"
              />
              <span className="relative grid size-12 place-items-center rounded-xl bg-primary-foreground/15 transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-gold group-hover:text-gold-foreground">
                <AppIcon name={o.icon} size={24} />
              </span>
              <p className="relative mt-4 font-display font-semibold">{o.title}</p>
              <p className="relative mt-2 text-sm leading-relaxed opacity-90">{o.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
