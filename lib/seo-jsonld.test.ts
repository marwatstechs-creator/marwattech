import { describe, it, expect } from "vitest";

import {
  organizationJsonLd,
  websiteJsonLd,
  webPageJsonLd,
  breadcrumbJsonLd,
  serviceJsonLd,
  creativeWorkJsonLd,
  jobPostingJsonLd,
  faqPageJsonLd,
} from "@/lib/seo-jsonld";
import { SITE } from "@/lib/constants";

describe("JSON-LD builders", () => {
  it("organization schema has required fields", () => {
    const org = organizationJsonLd();
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe(SITE.name);
    expect(org.url).toBe(SITE.url);
    expect(Array.isArray(org.sameAs)).toBe(true);
    expect(org.contactPoint).toBeTruthy();
  });

  it("website schema references the site", () => {
    const ws = websiteJsonLd();
    expect(ws["@type"]).toBe("WebSite");
    expect(ws.url).toBe(SITE.url);
  });

  it("webPage schema builds an absolute URL", () => {
    const wp = webPageJsonLd({ title: "About", description: "x", path: "/pages/about" });
    expect(wp["@type"]).toBe("WebPage");
    expect(wp.url).toBe(`${SITE.url}/pages/about`);
    expect(wp.isPartOf).toBeTruthy();
  });

  it("breadcrumb schema numbers positions", () => {
    const bc = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]);
    expect(bc["@type"]).toBe("BreadcrumbList");
    expect((bc.itemListElement as Array<{ position: number }>)[0].position).toBe(1);
    expect((bc.itemListElement as Array<{ position: number }>)[1].position).toBe(2);
  });

  it("service schema has provider", () => {
    const svc = serviceJsonLd({ name: "SEO", description: "d", path: "/services/seo" });
    expect(svc["@type"]).toBe("Service");
    expect(svc.provider).toBeTruthy();
  });

  it("creativeWork schema has author/organization", () => {
    const cw = creativeWorkJsonLd({ name: "P1", path: "/portfolio/p1" });
    expect(cw["@type"]).toBe("CreativeWork");
    expect(cw.creator).toBeTruthy();
  });

  it("jobPosting schema builds hiring organization", () => {
    const jp = jobPostingJsonLd({
      title: "Developer",
      slug: "developer",
      location: "Karachi",
      job_type: "Full-time",
      description: "Build things",
    });
    expect(jp["@type"]).toBe("JobPosting");
    expect(jp.hiringOrganization).toBeTruthy();
    expect(jp.jobLocation).toBeTruthy();
  });

  it("faqPage schema maps questions/answers", () => {
    const faq = faqPageJsonLd([
      { question: "Q1?", answer: "A1" },
      { question: "Q2?", answer: "A2" },
    ]);
    expect(faq["@type"]).toBe("FAQPage");
    expect((faq.mainEntity as Array<{ name: string }>)[0].name).toBe("Q1?");
    expect(faq.mainEntity).toHaveLength(2);
  });
});
