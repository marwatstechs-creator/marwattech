import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHero } from "@/components/marketing/page-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { ServiceCard } from "@/components/marketing/service-card";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeader } from "@/components/marketing/section-header";
import { createClient } from "@/lib/supabase/server";
import {
  getServiceBySlug,
  getRelatedServices,
} from "@/lib/db/content";
import { DEMO_SERVICES } from "@/lib/demo";
import { sanitizeHtml } from "@/lib/sanitize";
import { buildMetadata } from "@/lib/seo";
import { serviceJsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo-jsonld";
import { JsonLd } from "@/components/seo/json-ld";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

type Benefit = { title: string; description: string };
type Step = { step?: string; title: string; description: string };
type Faq = { question: string; answer: string };

export async function generateStaticParams() {
  return DEMO_SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let service = DEMO_SERVICES.find((s) => s.slug === slug) ?? null;
  try {
    const db = await createClient();
    service = (await getServiceBySlug(db, slug)) ?? service;
  } catch {
    // fallback
  }
  if (!service) return {};

  return buildMetadata({
    title: service.meta_title ?? service.title,
    description: service.meta_description ?? service.summary ?? "",
    path: `/services/${service.slug}`,
    image: service.og_image,
    canonical: service.canonical_url,
  });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;

  let service = DEMO_SERVICES.find((s) => s.slug === slug) ?? null;
  let related: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    icon: string | null;
  }[] = DEMO_SERVICES.filter((s) => s.slug !== slug).slice(0, 3);

  try {
    const db = await createClient();
    const data = await getServiceBySlug(db, slug);
    if (data) {
      service = data;
      const rel = await getRelatedServices(db, data.id, 3);
      if (rel.length) related = rel;
    } else if (!service) {
      notFound();
    }
  } catch {
    if (!service) notFound();
  }

  if (!service) notFound();

  const benefits = (service.benefits as Benefit[] | null) ?? [];
  const process = (service.process as Step[] | null) ?? [];
  const faqs = (service.faqs as Faq[] | null) ?? [];
  const content = service.content ? sanitizeHtml(service.content) : "";

  return (
    <>
      <JsonLd
        data={[
          serviceJsonLd({
            name: service.title,
            description: service.summary,
            path: `/services/${service.slug}`,
            image: service.og_image,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.title, path: `/services/${service.slug}` },
          ]),
        ]}
      />
      <PageHero
        title={service.title}
        description={service.summary ?? undefined}
        breadcrumbs={[
          { label: "Services", href: "/services" },
          { label: service.title },
        ]}
      />

      {/* Content + benefits */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="prose-cms" dangerouslySetInnerHTML={{ __html: content }} />

          {benefits.length > 0 && (
            <aside className="space-y-4">
              <h2 className="font-display text-xl font-bold">Key benefits</h2>
              <div className="space-y-3">
                {benefits.map((b, i) => (
                  <Card key={i}>
                    <CardContent className="flex gap-3 p-4">
                      <AppIcon name="check" size={18} className="mt-0.5 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium">{b.title}</p>
                        <p className="text-sm text-muted-foreground">{b.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* Process */}
      {process.length > 0 && (
        <section className="border-y bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Our process"
              title="How we deliver"
              description="A clear, proven workflow from kickoff to launch."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {process.map((p, i) => (
                <div key={i} className="relative rounded-xl border bg-card p-6">
                  <Badge variant="gold" className="mb-3">
                    Step {p.step ?? i + 1}
                  </Badge>
                  <h3 className="font-display mb-1 font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <JsonLd data={faqPageJsonLd(faqs)} />
          <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="font-semibold">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* Related services */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Explore more" title="Related services" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
