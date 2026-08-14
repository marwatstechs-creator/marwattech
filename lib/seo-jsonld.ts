/**
 * JSON-LD structured data builders (schema.org) — generated automatically
 * from the site's real content so every public page ships SEO markup.
 * Pure functions (no Next/Supabase imports) for easy testing.
 */
import { SITE } from "@/lib/constants";

type JsonLd = Record<string, unknown>;

const url = (path: string) => `${SITE.url.replace(/\/$/, "")}${path}`;

/** Organization (site-wide, used on the homepage). */
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: url("/og-default.png"),
    description: SITE.description,
    sameAs: [
      SITE.social.facebook,
      SITE.social.linkedin,
      SITE.social.instagram,
      SITE.social.youtube,
    ].filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE.phone,
      contactType: "customer service",
      areaServed: "PK",
      availableLanguage: ["en", "ur"],
    },
  };
}

/** WebSite (homepage). */
export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: url("/og-default.png") },
    },
  };
}

/** Generic WebPage (custom CMS pages). */
export function webPageJsonLd(opts: {
  title: string;
  description?: string | null;
  path: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.title,
    description: opts.description ?? undefined,
    url: url(opts.path),
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name },
  };
}

/** BreadcrumbList. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: url(it.path),
    })),
  };
}

/** Service (services detail pages). */
export function serviceJsonLd(opts: {
  name: string;
  description?: string | null;
  path: string;
  image?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description ?? undefined,
    url: url(opts.path),
    image: opts.image ?? undefined,
    provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
    areaServed: "PK",
    serviceType: opts.name,
  };
}

/** CreativeWork (portfolio projects). */
export function creativeWorkJsonLd(opts: {
  name: string;
  description?: string | null;
  path: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: opts.name,
    description: opts.description ?? undefined,
    url: url(opts.path),
    image: opts.image ?? undefined,
    datePublished: opts.datePublished ?? undefined,
    dateModified: opts.dateModified ?? undefined,
    creator: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}

/** JobPosting (careers listings). */
export function jobPostingJsonLd(job: {
  title: string;
  slug: string;
  department?: string | null;
  location?: string | null;
  job_type?: string | null;
  description?: string | null;
  datePosted?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description ?? undefined,
    datePosted: job.datePosted ?? undefined,
    employmentType: job.job_type ?? undefined,
    hiringOrganization: { "@type": "Organization", name: SITE.name, sameAs: SITE.url },
    jobLocation: job.location
      ? {
          "@type": "Place",
          address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "PK" },
        }
      : undefined,
  };
}

/** FAQPage (Q&A content — services FAQs). */
export function faqPageJsonLd(
  faqs: { question: string; answer: string }[]
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
