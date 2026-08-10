import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { GoogleReviewsSection } from "@/components/marketing/google-reviews-section";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Testimonials",
  description:
    "Read what our clients say about working with Marwat Tech — real feedback from businesses we’ve helped grow.",
  path: "/testimonials",
});

export default function TestimonialsPage() {
  return (
    <>
      <PageHero
        badge="Testimonials"
        title="Trusted by businesses like yours"
        description="Don’t just take our word for it — here’s what clients say about working with Marwat Tech."
        breadcrumbs={[{ label: "Testimonials" }]}
      />

      <GoogleReviewsSection />

      <CtaBanner />
    </>
  );
}
