import type { Metadata } from "next";
import Link from "next/link";

import { Hero } from "@/components/marketing/hero";
import { SectionHeader } from "@/components/marketing/section-header";
import { ServiceCard } from "@/components/marketing/service-card";
import { PortfolioCard } from "@/components/marketing/portfolio-card";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { BlogCard } from "@/components/marketing/blog-card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  getFeaturedServices,
  getFeaturedProjects,
  getFeaturedTestimonials,
  getPublishedPosts,
} from "@/lib/db/content";
import {
  DEMO_SERVICES,
  DEMO_PROJECTS,
  DEMO_POSTS,
  DEMO_TESTIMONIALS,
} from "@/lib/demo";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";

export const revalidate = 3600; // ISR — revalidate hourly

export const metadata: Metadata = buildMetadata({
  title: `${SITE.name} | Web Development, Ecommerce, SEO & AI Solutions`,
  description: SITE.description,
  path: "/",
});

const FEATURES = [
  {
    icon: "rocket" as const,
    title: "Fast & Modern",
    text: "Built with Next.js and edge deployment for instant load times and green Core Web Vitals.",
  },
  {
    icon: "shield" as const,
    title: "Secure by Design",
    text: "HTTPS, input validation, role-based access and rigorous security practices on every project.",
  },
  {
    icon: "search" as const,
    title: "SEO Optimised",
    text: "Structured data, sitemaps and clean markup so customers actually find you on Google.",
  },
  {
    icon: "chat" as const,
    title: "24/7 Support",
    text: "Real humans, fast replies. We stay with you long after launch with affordable maintenance.",
  },
  {
    icon: "dollar" as const,
    title: "Transparent Pricing",
    text: "Clear quotes and no hidden fees. Free mockups so you know exactly what you’re getting.",
  },
  {
    icon: "target" as const,
    title: "Result Driven",
    text: "We measure what matters — traffic, leads and revenue — and design for conversion.",
  },
];

const STEPS = [
  { step: "01", title: "Tell us your idea", text: "Share your goals through the free mockup form or a quick call." },
  { step: "02", title: "Get your free mockup", text: "We design a homepage concept so you can see your vision first." },
  { step: "03", title: "We build & launch", text: "Agile development with demos, then launch with training and support." },
];

export default async function HomePage() {
  let services = DEMO_SERVICES;
  let projects = DEMO_PROJECTS;
  let testimonials = DEMO_TESTIMONIALS;
  let posts = DEMO_POSTS;

  try {
    const db = await createClient();
    const [s, p, t, postsRes] = await Promise.all([
      getFeaturedServices(db, 6),
      getFeaturedProjects(db, 6),
      getFeaturedTestimonials(db, 3),
      getPublishedPosts(db, { page: 1, perPage: 3 }),
    ]);
    services = s.length ? s : DEMO_SERVICES;
    projects = p.length ? p : DEMO_PROJECTS;
    testimonials = t.length ? t : DEMO_TESTIMONIALS.slice(0, 3);
    posts = postsRes.posts.length ? postsRes.posts : DEMO_POSTS;
  } catch {
    // Supabase not configured yet — fall back to demo content.
  }

  return (
    <>
      <Hero />

      {/* Core services */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="What we do"
          title="Services built around your goals"
          description="From a simple brochure site to a full ecommerce or AI product — we cover the entire digital journey."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/services">
            <Button size="lg" variant="outline">
              View all services
              <AppIcon name="arrowRight" size={16} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Why choose us */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Why Marwat Tech"
            title="A partner, not just a vendor"
            description="We combine senior engineering talent with a genuine focus on your business outcomes."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <AppIcon name={f.icon} size={22} />
                </span>
                <h3 className="font-display mb-2 text-lg font-semibold">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio preview */}
      {projects.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Our work"
            title="Projects we’re proud of"
            description="A selection of recent websites, apps and brands we’ve designed and built."
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <PortfolioCard key={p.id} project={p} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/portfolio">
              <Button size="lg" variant="outline">
                View full portfolio
                <AppIcon name="arrowRight" size={16} />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Simple process"
            title="From idea to launch in 3 steps"
            description="A transparent, proven workflow — no surprises, no jargon."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative rounded-xl border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-display text-4xl font-extrabold text-primary/20">
                    {s.step}
                  </span>
                  {i < STEPS.length - 1 && (
                    <AppIcon
                      name="arrowRight"
                      size={20}
                      className="hidden text-muted-foreground/40 md:block"
                    />
                  )}
                </div>
                <h3 className="font-display mb-2 text-lg font-semibold">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Testimonials"
            title="What our clients say"
            description="Real feedback from businesses we’ve helped grow."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/testimonials">
              <Button variant="ghost">
                Read more reviews
                <AppIcon name="arrowRight" size={16} />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Latest posts */}
      {posts.length > 0 && (
        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-xl space-y-3">
                <Badge variant="gold" className="uppercase tracking-wide">
                  Blog
                </Badge>
                <h2 className="font-display text-3xl font-bold sm:text-4xl">
                  Insights & guides
                </h2>
                <p className="text-muted-foreground">
                  Practical advice on web development, SEO and growing online.
                </p>
              </div>
              <Link href="/blog">
                <Button variant="outline">
                  View all posts
                  <AppIcon name="arrowRight" size={16} />
                </Button>
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBanner />
    </>
  );
}
