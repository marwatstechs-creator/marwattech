import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Faq } from "@/components/marketing/faq";
import { ContactForm } from "@/components/forms/contact-form";
import { AppIcon } from "@/components/app-icon";
import { SITE } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact Us",
  description:
    "Get in touch with Marwat Tech for a free quote, project consultation or any question. We reply within 24 hours.",
  path: "/contact",
});

const CONTACT_CARDS = [
  {
    icon: "phone" as const,
    title: "Call us",
    lines: [SITE.phone],
    href: `tel:${SITE.phone.replace(/\s/g, "")}`,
  },
  {
    icon: "mail" as const,
    title: "Email us",
    lines: [SITE.email, SITE.supportEmail],
    href: `mailto:${SITE.email}`,
  },
  {
    icon: "pin" as const,
    title: "Visit us",
    lines: [SITE.location],
    href: undefined,
  },
  {
    icon: "clock" as const,
    title: "Working hours",
    lines: [SITE.hours],
    href: undefined,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        badge="Contact"
        title="Let’s talk about your project"
        description="Tell us what you need — a quote, a consultation or just some friendly advice. We’ll get back to you within 24 hours."
        breadcrumbs={[{ label: "Contact" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          {/* Info */}
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {CONTACT_CARDS.map((c) => {
                const content = (
                  <div className="flex items-start gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <AppIcon name={c.icon} size={22} />
                    </span>
                    <div>
                      <h3 className="font-display font-semibold">{c.title}</h3>
                      {c.lines.map((l, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {l}
                        </p>
                      ))}
                    </div>
                  </div>
                );
                return c.href ? (
                  <a key={c.title} href={c.href} className="block">
                    {content}
                  </a>
                ) : (
                  <div key={c.title}>{content}</div>
                );
              })}
            </div>

            <div className="rounded-xl border bg-primary p-6 text-primary-foreground">
              <h3 className="font-display mb-2 text-lg font-bold">
                Prefer WhatsApp?
              </h3>
              <p className="mb-4 text-sm text-primary-foreground/85">
                Chat with our team directly for a quick response.
              </p>
              <a
                href={SITE.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/25"
              >
                <AppIcon name="whatsapp" size={16} />
                Message on WhatsApp
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <h2 className="font-display mb-1 text-2xl font-bold">
              Send us a message
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Fields marked * are required. We never share your details.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

      <Faq
        title="Contact — FAQ"
        description="Quick answers before you reach out."
        items={[
          { question: "How quickly will I get a reply?", answer: "We respond to every enquiry within 24 hours — usually much faster on WhatsApp." },
          { question: "Do you offer free quotes and mockups?", answer: "Yes — we provide a free quote and a free homepage mockup so you can see our quality before committing." },
          { question: "What should I include in my message?", answer: "Tell us about your project, goals, timeline and budget. The more detail you share, the more accurate your quote." },
          { question: "Can you handle an urgent project?", answer: "We can. Message us on WhatsApp with your deadline and we'll let you know if we can fit it in." },
        ]}
      />

      <CtaBanner />
    </>
  );
}
