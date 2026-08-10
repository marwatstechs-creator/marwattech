import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeader } from "@/components/marketing/section-header";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { STATS } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Us",
  description:
    "Learn about Marwat Tech — the team, mission and values behind fast, secure and beautiful websites, apps and AI solutions.",
  path: "/about",
});

const VALUES = [
  {
    icon: "target" as const,
    title: "Client success first",
    text: "We win when our clients grow. Every decision is measured against your business goals.",
  },
  {
    icon: "medal" as const,
    title: "Quality over shortcuts",
    text: "Clean, tested, maintainable code. We don’t ship what we wouldn’t be proud of.",
  },
  {
    icon: "sparkles" as const,
    title: "Honest communication",
    text: "Clear timelines, transparent pricing and no jargon. You always know where things stand.",
  },
  {
    icon: "info" as const,
    title: "Continuous learning",
    text: "We invest in the latest tools and techniques so your project benefits from today’s best practices.",
  },
];

const TEAM = [
  { name: "Irfan Shah", role: "Founder & Lead Developer", initials: "IS" },
  { name: "Ayesha Malik", role: "Head of Design", initials: "AM" },
  { name: "Usman Tariq", role: "Full-Stack Engineer", initials: "UT" },
  { name: "Zainab Noor", role: "SEO & Content Lead", initials: "ZN" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        badge="About Us"
        title="The team behind the pixels"
        description="Marwat Tech is a full-service software and web development company helping businesses grow with fast, secure and beautiful digital products."
        breadcrumbs={[{ label: "About" }]}
      />

      {/* Story */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-5">
            <Badge variant="gold" className="uppercase tracking-wide">
              Our story
            </Badge>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              From a single project to a full digital partner
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Marwat Tech started with a simple belief: small and growing
                businesses deserve the same quality of engineering as large
                enterprises — without the enterprise price tag or bureaucracy.
              </p>
              <p>
                Today we design and build websites, ecommerce stores, mobile
                apps and AI-powered products for clients around the world. Our
                team of developers, designers and SEO specialists work as one
                unit, combining modern technology with practical business
                thinking.
              </p>
              <p>
                We’re proud that most of our work comes from referrals — a
                result of treating every project like it’s our own.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-6">
                <span className="mb-3 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <AppIcon name="rocket" size={20} />
                </span>
                <p className="font-display text-2xl font-bold">{STATS[0].value}</p>
                <p className="text-sm text-muted-foreground">{STATS[0].label}</p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <span className="mb-3 grid size-10 place-items-center rounded-lg bg-gold/15 text-gold">
                  <AppIcon name="star" size={20} />
                </span>
                <p className="font-display text-2xl font-bold">4.9/5</p>
                <p className="text-sm text-muted-foreground">Average client rating</p>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="rounded-xl border bg-card p-6">
                <span className="mb-3 grid size-10 place-items-center rounded-lg bg-azure/15 text-azure">
                  <AppIcon name="team" size={20} />
                </span>
                <p className="font-display text-2xl font-bold">{STATS[1].value}</p>
                <p className="text-sm text-muted-foreground">{STATS[1].label}</p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <span className="mb-3 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <AppIcon name="clock" size={20} />
                </span>
                <p className="font-display text-2xl font-bold">24/7</p>
                <p className="text-sm text-muted-foreground">Support & monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <AppIcon name="quote" size={40} className="mx-auto mb-6 text-primary" />
          <blockquote className="font-display text-2xl font-semibold leading-snug sm:text-3xl">
            “Our mission is to make world-class software and design accessible
            to every business — and to be the partner our clients can always
            count on.”
          </blockquote>
          <p className="mt-6 text-sm font-medium text-muted-foreground">
            — The Marwat Tech Team
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Our values"
          title="What we stand for"
          description="The principles that guide how we work and how we treat our clients."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl border bg-card p-6">
              <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <AppIcon name={v.icon} size={22} />
              </span>
              <h3 className="font-display mb-2 text-lg font-semibold">{v.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Our team"
            title="Meet the people behind Marwat Tech"
            description="A small, senior team that moves fast and communicates clearly."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m) => (
              <div
                key={m.name}
                className="flex flex-col items-center rounded-xl border bg-card p-6 text-center"
              >
                <span className="mb-4 grid size-16 place-items-center rounded-full bg-primary/10 font-display text-xl font-bold text-primary">
                  {m.initials}
                </span>
                <h3 className="font-display font-semibold">{m.name}</h3>
                <p className="text-sm text-muted-foreground">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
