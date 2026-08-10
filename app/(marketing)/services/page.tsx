import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { ServiceCard } from "@/components/marketing/service-card";
import { CtaBanner } from "@/components/marketing/cta-banner";
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

      <CtaBanner />
    </>
  );
}
