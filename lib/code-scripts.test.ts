import { describe, expect, it } from "vitest";
import {
  parseSitemapUrls,
  extractVersion,
  plainText,
  buildExcerpt,
  buildSoftwareJsonLd,
  buildFaqJsonLd,
  codeScriptUrl,
  stripSourceLinks,
} from "./code-scripts";

describe("parseSitemapUrls", () => {
  it("extracts all <loc> URLs from a sitemap", () => {
    const xml = `<?xml version="1.0"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://nullphpscript.com/post/foo-script/</loc></url>
        <url><loc>https://nullphpscript.com/post/bar-theme/</loc></url>
      </urlset>`;
    expect(parseSitemapUrls(xml)).toEqual([
      "https://nullphpscript.com/post/foo-script/",
      "https://nullphpscript.com/post/bar-theme/",
    ]);
  });

  it("handles a sitemap index (nested locs)", () => {
    const xml = `<sitemapindex><sitemap><loc>https://nullphpscript.com/post-sitemap.xml</loc></sitemap></sitemapindex>`;
    expect(parseSitemapUrls(xml)).toEqual([
      "https://nullphpscript.com/post-sitemap.xml",
    ]);
  });

  it("returns [] for empty/garbage", () => {
    expect(parseSitemapUrls("")).toEqual([]);
    expect(parseSitemapUrls("<html></html>")).toEqual([]);
    expect(parseSitemapUrls(null as unknown as string)).toEqual([]);
  });
});

describe("stripSourceLinks", () => {
  it("removes source-site anchors but keeps their text", () => {
    const html = `Read more <a href="https://nullphpscript.com/post/foo/">here</a> or
      <a rel="nofollow" target="_blank" href="https://www.nullphpscript.com/file/abc">mirror</a>`;
    const out = stripSourceLinks(html);
    expect(out).not.toContain("nullphpscript.com");
    expect(out).toContain("here");
    expect(out).toContain("mirror");
  });
  it("removes hotlinked source-site images", () => {
    const html = `Before<img data-src="https://nullphpscript.com/wp-content/uploads/a.png" src="x" alt="">After`;
    const out = stripSourceLinks(html);
    expect(out).not.toContain("nullphpscript.com");
    expect(out).toBe("BeforeAfter");
  });
  it("removes source-site JSON-LD script blocks", () => {
    const html = `<p>ok</p><script type="application/ld+json">{"@id":"https://nullphpscript.com/post/a","author":{"url":"https://nullphpscript.com/post/author/x/"}}</script>`;
    const out = stripSourceLinks(html);
    expect(out).not.toContain("nullphpscript.com");
    expect(out).toBe("<p>ok</p>");
  });
  it("leaves unrelated links untouched", () => {
    const html = `<a href="https://example.com/dl">ok</a>`;
    expect(stripSourceLinks(html)).toBe(html);
  });
});

describe("extractVersion", () => {
  it("parses 'ver 2.0' / 'Version 1.4.2' / 'v3.0'", () => {
    expect(extractVersion("Download ver 2.0 here")).toBe("2.0");
    expect(extractVersion("Version 1.4.2 released")).toBe("1.4.2");
    expect(extractVersion("v3.0 download")).toBe("3.0");
  });
  it("returns null when no version", () => {
    expect(extractVersion("just a script")).toBeNull();
    expect(extractVersion(null)).toBeNull();
    expect(extractVersion(undefined)).toBeNull();
  });
});

describe("plainText / buildExcerpt", () => {
  it("strips tags and collapses whitespace", () => {
    expect(plainText("<p>Hello <b>world</b> &amp; more</p>")).toBe("Hello world & more");
  });
  it("truncates with ellipsis", () => {
    const long = "<p>" + "a".repeat(200) + "</p>";
    const ex = buildExcerpt(long, 100);
    expect(ex.endsWith("…")).toBe(true);
    expect(ex.length).toBeLessThanOrEqual(101);
  });
});

describe("codeScriptUrl", () => {
  it("builds a detail URL", () => {
    expect(codeScriptUrl("my-script")).toBe("/code-scripts/my-script");
  });
});

describe("JSON-LD builders", () => {
  const base = {
    title: "Awesome Script",
    slug: "awesome-script",
    category: "PHP Scripts",
    version: "2.0",
    seo_description: "A great script.",
    cover_image: "https://media.marwattech.com/cover.webp",
    created_at: "2026-08-17T00:00:00Z",
    updated_at: "2026-08-17T00:00:00Z",
  };

  it("builds a SoftwareApplication node", () => {
    const node = buildSoftwareJsonLd(base);
    expect(node["@type"]).toBe("SoftwareApplication");
    expect(node.softwareVersion).toBe("2.0");
    expect(node.url).toContain("/code-scripts/awesome-script");
    expect(node.offers).toBeTruthy();
  });

  it("builds a FAQPage node and null for empty", () => {
    const node = buildFaqJsonLd([
      { q: "What is it?", a: "A script." },
      { q: "Is it free?", a: "Yes." },
    ]);
    expect(node?.["@type"]).toBe("FAQPage");
    expect((node as { mainEntity: unknown[] }).mainEntity).toHaveLength(2);
    expect(buildFaqJsonLd([])).toBeNull();
    expect(buildFaqJsonLd(undefined as unknown as { q: string; a: string }[])).toBeNull();
  });
});
