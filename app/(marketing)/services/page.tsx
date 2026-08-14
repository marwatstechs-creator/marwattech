import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { ServiceCard } from "@/components/marketing/service-card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Faq } from "@/components/marketing/faq";
import { createClient } from "@/lib/supabase/server";
import { getPublishedServices } from "@/lib/db/content";
import { DEMO_SERVICES } from "@/lib/demo";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Services",
  description:
    "Explore Marwat Tech services — web development, Next.js, WordPress, ecommerce, mobile apps, UI/UX design, SEO, maintenance and AI solutions.",
  path: "/services",
});

const SERVICES_FAQ = [
  { question: "How much does a website cost?", answer: "Pricing depends on the scope — a brochure site, custom web app and e-commerce store all differ. Send us your requirements and we'll give you a free, no-obligation quote within 24 hours." },
  { question: "How long does it take to build a website?", answer: "Most marketing websites launch in 1–3 weeks. Larger web apps and e-commerce builds typically take 3–8 weeks depending on features. You'll get a clear timeline before we start." },
  { question: "Do you provide hosting and domain?", answer: "Yes — we offer reliable hosting, domain registration and email setup. We can also migrate your existing site with zero downtime." },
  { question: "Do you offer support and maintenance after launch?", answer: "Absolutely. We have affordable maintenance plans covering updates, backups, security and small changes, plus 24/7 support." },
  { question: "Can you redesign my existing website?", answer: "Yes. We audit your current site, then design and build a modern, faster, SEO-friendly version while preserving what works." },
  { question: "Do you work with international clients?", answer: "Yes — we work with clients worldwide. We communicate over email, WhatsApp and video calls, and handle payments securely." },
];

export default async function ServicesPage() {
  let services = DEMO_SERVICES;
  try {
    const db = await createClient();
    const data = await getPublishedServices(db);
    services = data.length ? data : DEMO_SERVICES;
  } catch {
    // fallback to demo
  }

  return (
    <>
      <PageHero
        badge="Services"
        title="Everything you need to grow online"
        description="Strategy, design, development and growth — under one roof. Pick a service or talk to us and we’ll recommend the right mix."
        breadcrumbs={[{ label: "Services" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      <Faq
        title="Services — FAQ"
        description="Answers to the questions we get most about our services."
        items={SERVICES_FAQ}
      />

      <CtaBanner />
    </>
  );
}
