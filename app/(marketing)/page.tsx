import type { Metadata } from "next";
import Link from "next/link";

import { Hero } from "@/components/marketing/hero";
import { SectionHeader } from "@/components/marketing/section-header";
import { ServiceCard } from "@/components/marketing/service-card";
import { PortfolioCard } from "@/components/marketing/portfolio-card";
import { ReviewsMarquee } from "@/components/marketing/reviews-marquee";
import { LogoWatermark } from "@/components/marketing/logo-watermark";
import { GoogleReviewsHomeBanner } from "@/components/marketing/google-reviews-home-banner";
import { BlogCard } from "@/components/marketing/blog-card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  getFeaturedServices,
  getFeaturedProjects,
  getPublishedPosts,
} from "@/lib/db/content";
import {
  DEMO_SERVICES,
  DEMO_PROJECTS,
  DEMO_POSTS,
} from "@/lib/demo";
import { getGoogleReviews } from "@/lib/google/reviews";
import { buildMetadata } from "@/lib/seo";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo-jsonld";
import { JsonLd } from "@/components/seo/json-ld";
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
  { step: "01", icon: "chat", title: "Tell us your idea", text: "Share your goals through the free mockup form or a quick call.", footer: "Free 30-minute consultation" },
  { step: "02", icon: "sparkles", title: "Get your free mockup", text: "We design a homepage concept so you can see your vision first.", footer: "No obligation, no cost" },
  { step: "03", icon: "rocket", title: "We build & launch", text: "Agile development with demos, then launch with training and support.", footer: "Launch in as little as 2 weeks" },
] as const;

export default async function HomePage() {
  let services = DEMO_SERVICES;
  let projects = DEMO_PROJECTS;
  let posts = DEMO_POSTS;

  // Real Google reviews for the testimonials section (no fake testimonials).
  let googleReviews: Array<{
    id: string;
    client_name: string;
    company: string | null;
    role: string | null;
    quote: string;
    rating: number;
    avatar_url: string | null;
  }> = [];
  let googlePlaceUrl = "https://maps.google.com/?cid=15403920924729213100";

  // Keep every review card the same size: cap the text at the first two sentences.
  const firstSentences = (text: string, max = 2) => {
    const cleaned = text.trim();
    const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
    if (!sentences || sentences.length <= max) return cleaned;
    return sentences.slice(0, max).join(" ").trim() + "…";
  };

  try {
    const db = await createClient();
    const [s, p, postsRes] = await Promise.all([
      getFeaturedServices(db, 6),
      getFeaturedProjects(db, 6),
      getPublishedPosts(db, { page: 1, perPage: 3 }),
    ]);
    services = s.length ? s : DEMO_SERVICES;
    projects = p.length ? p : DEMO_PROJECTS;
    posts = postsRes.posts.length ? postsRes.posts : DEMO_POSTS;
  } catch {
    // Supabase not configured yet — fall back to demo content.
  }

  try {
    const google = await getGoogleReviews();
    googlePlaceUrl = google.place_url;
    googleReviews = google.reviews.map((r, i) => ({
      id: `google-${i}`,
      client_name: r.author_name,
      company: r.relative_time_description ?? null,
      role: "Google Review",
      quote: firstSentences(r.text) || "No written review.",
      rating: r.rating,
      avatar_url: r.profile_photo_url,
    }));
  } catch {
    // Google API unreachable — leave the section hidden rather than show fakes.
  }

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
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
                className="relative overflow-hidden rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <LogoWatermark className="bottom-0 right-0 h-24 w-24 translate-x-5 translate-y-5" />
                <span className="relative mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
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
          <div className="relative">
            {/* Connecting lines (horizontal on desktop, vertical on mobile) */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
              <div className="absolute inset-x-0 top-1/2 hidden h-px -translate-y-1/2 bg-border xl:block">
                <div className="h-full w-full bg-primary" />
              </div>
              <div className="absolute inset-y-0 left-1/2 block w-px -translate-x-1/2 bg-border md:hidden">
                <div className="h-full w-full bg-primary" />
              </div>
            </div>
            <div className="relative z-[1] grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {STEPS.map((s) => (
                <article
                  key={s.step}
                  className="group relative flex min-h-[278px] flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:border-primary/40 hover:bg-accent-hover"
                >
                  <LogoWatermark className="bottom-0 right-0 h-24 w-24 translate-x-5 translate-y-5" />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-[15px] top-[57px] z-0 -translate-y-1/2 font-display text-[102px] font-semibold leading-none tracking-tight opacity-20 transition-colors duration-500 text-primary group-hover:opacity-30"
                  >
                    {s.step}
                  </span>
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                      <div className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-accent px-5 py-2 transition-colors duration-200 group-hover:border-primary">
                        <AppIcon
                          name={s.icon}
                          size={22}
                          className="text-foreground/70 transition-colors duration-200 group-hover:text-primary"
                        />
                      </div>
                      <h3 className="max-w-[300px] font-display text-xl font-semibold capitalize text-foreground">
                        {s.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {s.text}
                    </p>
                  </div>
                  <div className="relative z-10 mt-6 border-t border-dashed border-border pt-3">
                    <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                      {s.footer}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews Banner */}
      <GoogleReviewsHomeBanner />

      {/* Google Reviews (real, from the Google Places API) */}
      {googleReviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeader
            eyebrow="Google Reviews"
            title="What our clients say"
            description="Real feedback straight from our Google Business Profile."
          />
          <ReviewsMarquee items={googleReviews.slice(0, 6)} />
          <div className="mt-10 text-center">
            <Link href={googlePlaceUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                Leave a review on Google
                <AppIcon name="external" size={16} />
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
