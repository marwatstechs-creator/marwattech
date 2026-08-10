import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeader } from "@/components/marketing/section-header";
import { MockupForm } from "@/components/forms/mockup-form";
import { AppIcon } from "@/components/app-icon";
import { Card, CardContent } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free Website Mockup",
  description:
    "Get a free homepage mockup design for your business — no obligation. See your idea before you commit.",
  path: "/free-mockup",
});

const STEPS = [
  {
    icon: "edit" as const,
    step: "1",
    title: "Tell us about your business",
    text: "Fill in the form with your industry, goals and any sites you like.",
  },
  {
    icon: "design" as const,
    step: "2",
    title: "We design your homepage",
    text: "Our designers craft a custom homepage concept tailored to your brand.",
  },
  {
    icon: "chat" as const,
    step: "3",
    title: "Review & decide",
    text: "See your mockup, share feedback, and choose whether to move forward.",
  },
];

const PERKS = [
  "100% free — no payment details",
  "Custom design, not a template",
  "Delivered in 2–3 business days",
  "Keep the concept even if you don’t proceed",
];

export default function FreeMockupPage() {
  return (
    <>
      <PageHero
        badge="Free Mockup"
        title="See your website before you pay a penny"
        description="Submit a quick form and we’ll design a free homepage mockup for your business. No obligation — just proof of what we can do."
        breadcrumbs={[{ label: "Free Mockup" }]}
      />

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="Your free mockup in 3 easy steps"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.step} className="h-full">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-gold/15 text-gold">
                    <AppIcon name={s.icon} size={22} />
                  </span>
                  <span className="font-display text-3xl font-extrabold text-primary/20">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-display mb-2 text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Form + perks */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-bold">
                Why request a mockup?
              </h2>
              <ul className="space-y-3">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <AppIcon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
                    <span className="text-sm text-foreground/85">{p}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-display mb-2 font-semibold">What you’ll get</h3>
                <p className="text-sm text-muted-foreground">
                  A high-quality homepage concept with layout, colours and
                  typography matched to your brand — ready to turn into a
                  complete website if you love it.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 sm:p-8">
              <h2 className="font-display mb-1 text-2xl font-bold">
                Request your free mockup
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Fields marked * are required.
              </p>
              <MockupForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
