import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { createClient } from "@/lib/supabase/server";
import { getTestimonials } from "@/lib/db/content";
import { DEMO_TESTIMONIALS } from "@/lib/demo";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Testimonials",
  description:
    "Read what our clients say about working with Marwat Tech — real feedback from businesses we’ve helped grow.",
  path: "/testimonials",
});

export default async function TestimonialsPage() {
  let testimonials = DEMO_TESTIMONIALS;
  try {
    const db = await createClient();
    const data = await getTestimonials(db);
    testimonials = data.length ? data : DEMO_TESTIMONIALS;
  } catch {
    // fallback
  }

  return (
    <>
      <PageHero
        badge="Testimonials"
        title="Trusted by businesses like yours"
        description="Don’t just take our word for it — here’s what clients say about working with Marwat Tech."
        breadcrumbs={[{ label: "Testimonials" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
