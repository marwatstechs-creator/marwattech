"use client";

import { motion } from "framer-motion";

import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";
import { fadeUp, rise, staggerContainer } from "./pricing-anim";

const ROWS: {
  label: string;
  us: string;
  others: { name: string; text: string; good?: boolean }[];
}[] = [
  {
    label: "All-in cost",
    us: "From $4.99/hr, published",
    others: [
      { name: "Freelance marketplaces", text: "Bid-based, wildly variable" },
      { name: "Dev agencies", text: "Quote-based, undisclosed" },
      { name: "In-house hire", text: "Salary + benefits + recruiting fees" },
    ],
  },
  {
    label: "Vetting",
    us: "Hand-picked senior talent, 95%+ rejected",
    others: [
      { name: "Freelance marketplaces", text: "Self-claimed profiles" },
      { name: "Dev agencies", text: "Varies by shop" },
      { name: "In-house hire", text: "Your own screening time" },
    ],
  },
  {
    label: "Time to hire",
    us: "Matched in days, not months",
    others: [
      { name: "Freelance marketplaces", text: "Days of sifting proposals" },
      { name: "Dev agencies", text: "Weeks" },
      { name: "In-house hire", text: "Months" },
    ],
  },
  {
    label: "Replacement guarantee",
    us: "Free replacements, guaranteed",
    others: [
      { name: "Freelance marketplaces", text: "None", good: false },
      { name: "Dev agencies", text: "Limited" },
      { name: "In-house hire", text: "Start over" },
    ],
  },
  {
    label: "Commitment",
    us: "Full-time, yours alone",
    others: [
      { name: "Freelance marketplaces", text: "Split across clients", good: false },
      { name: "Dev agencies", text: "Shared team" },
      { name: "In-house hire", text: "Full-time", good: true },
    ],
  },
];

function Check({ good }: { good: boolean }) {
  return (
    <span
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full transition-all duration-300",
        good ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
      )}
    >
      <AppIcon name={good ? "check" : "close"} size={13} />
    </span>
  );
}

export function PricingComparison() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <motion.div
        variants={staggerContainer(0.12)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mb-10 flex flex-col items-center gap-4 text-center"
      >
        <motion.span
          variants={fadeUp()}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary"
        >
          <span className="size-2 rounded-[2px] bg-primary" />
          The Comparison
        </motion.span>
        <motion.h2 variants={fadeUp(0.05)} className="font-display max-w-xl text-3xl font-bold sm:text-4xl">
          The true cost. <span className="text-primary">Compared.</span>
        </motion.h2>
      </motion.div>

      {/* Desktop table */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className="hidden overflow-hidden rounded-2xl border bg-card lg:block"
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-5 text-left" />
              <th className="bg-primary/5 p-5 text-left font-semibold text-primary">Marwat Tech</th>
              {ROWS[0].others.map((o) => (
                <th key={o.name} className="p-5 text-left font-semibold text-muted-foreground">
                  {o.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="group border-b last:border-0 transition-colors hover:bg-accent-hover">
                <th className="p-5 text-left font-semibold">{row.label}</th>
                <td className="bg-primary/5 p-5 font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    <AppIcon name="check" size={15} className="shrink-0 text-primary" />
                    {row.us}
                  </span>
                </td>
                {row.others.map((o) => (
                  <td key={o.name} className="p-5 text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Check good={!!o.good} />
                      {o.text}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Mobile stacked comparison */}
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="space-y-3 lg:hidden"
      >
        <motion.div
          variants={rise()}
          className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
        >
          <AppIcon name="check" size={16} /> Marwat Tech
        </motion.div>
        {ROWS.map((row) => (
          <motion.div key={row.label} variants={rise()} className="overflow-hidden rounded-xl border bg-card">
            <div className="border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {row.label}
            </div>
            <div className="flex items-start gap-2 px-4 py-3 text-sm font-medium">
              <AppIcon name="check" size={16} className="mt-0.5 shrink-0 text-primary" />
              {row.us}
            </div>
            {row.others.map((o) => (
              <div key={o.name} className="flex items-start gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
                <Check good={!!o.good} />
                <span>
                  <span className="font-medium text-foreground/80">{o.name}: </span>
                  {o.text}
                </span>
              </div>
            ))}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
