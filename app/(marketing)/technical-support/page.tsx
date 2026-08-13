import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { SupportForm } from "@/components/forms/support-form";
import { AppIcon } from "@/components/app-icon";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SITE } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Technical Support",
  description:
    "Need help with your website, hosting or an app? Submit a support ticket and our team will resolve your issue fast.",
  path: "/technical-support",
  noindex: true,
});

const SUPPORT_CHANNELS = [
  { icon: "chat" as const, title: "Submit a ticket", text: "Use the form — we reply within a few hours on business days." },
  { icon: "mail" as const, title: "Email support", text: SITE.supportEmail, href: `mailto:${SITE.supportEmail}` },
  { icon: "phone" as const, title: "Call us", text: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, "")}` },
  { icon: "whatsapp" as const, title: "WhatsApp", text: "Quick messages, 24/7", href: SITE.whatsapp },
];

const SUPPORT_FAQS = [
  {
    q: "How fast is your response time?",
    a: "Most tickets get a first response within 2–4 business hours. Urgent issues are prioritised immediately.",
  },
  {
    q: "Do you support websites you didn’t build?",
    a: "In most cases, yes. Our maintenance plans cover WordPress, Next.js and many other platforms.",
  },
  {
    q: "What information should I include?",
    a: "The page/URL affected, what you expected vs what happened, any error messages, and steps to reproduce.",
  },
  {
    q: "Is there a charge for support?",
    a: "Small issues are often free. Larger tasks are quoted first and only after you approve.",
  },
];

export default function SupportPage() {
  return (
    <>
      <PageHero
        badge="Technical Support"
        title="We’re here to help"
        description="Something broken, slow or not quite right? Open a ticket and our engineers will sort it out — fast."
        breadcrumbs={[{ label: "Technical Support" }]}
      />

      {/* Channels */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUPPORT_CHANNELS.map((c) => {
            const inner = (
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-start gap-3 p-6">
                  <span className="icon-3d-tile grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <AppIcon name={c.icon} size={22} />
                  </span>
                  <h3 className="font-display font-semibold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.text}</p>
                </CardContent>
              </Card>
            );
            return c.href ? (
              <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <div key={c.title}>{inner}</div>
            );
          })}
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <h2 className="font-display mb-1 text-2xl font-bold">
              Open a support ticket
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              The more detail you give, the faster we can fix it.
            </p>
            <SupportForm />
          </div>

          <div>
            <h2 className="font-display mb-4 text-xl font-bold">
              Support FAQs
            </h2>
            <Accordion type="single" collapsible className="rounded-xl border bg-card px-5">
              {SUPPORT_FAQS.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-semibold">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
}
