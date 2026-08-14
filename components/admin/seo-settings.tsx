"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * SEO & Search Engines card for Admin → Settings.
 * Shows the auto-generated sitemap/robots URLs with copy buttons plus links
 * to submit them to Google & Bing. The live sitemap URL list is fetched
 * client-side so it always reflects current content.
 */
export function SeoSettings({ sitemapUrl, robotsUrl }: { sitemapUrl: string; robotsUrl: string }) {
  const [urls, setUrls] = useState<string[] | null>(null);

  useEffect(() => {
    fetch("/sitemap.xml")
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error("sitemap fetch failed"))))
      .then((xml) => {
        const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
        setUrls(matches);
      })
      .catch(() => setUrls([]));
  }, []);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy — select the URL and copy manually.");
    }
  };

  return (
    <Card id="seo" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="icon-3d-tile grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <AppIcon name="globe" size={20} />
          </span>
          <div>
            <CardTitle className="font-display text-lg">SEO &amp; Search Engines</CardTitle>
            <CardDescription>
              Your sitemap and robots.txt are generated automatically from live content.
              Copy the links below to submit your site to search engines.
            </CardDescription>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="gold">{urls ? `${urls.length} URLs indexed` : "Loading…"}</Badge>
          <Badge variant="outline">Auto-updates on content save</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Sitemap */}
        <div className="space-y-2">
          <Label htmlFor="seo-sitemap">Sitemap URL</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="seo-sitemap" readOnly value={sitemapUrl} className="flex-1 font-mono text-xs" />
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" onClick={() => copy(sitemapUrl, "Sitemap URL")}>
                <AppIcon name="copy" size={15} /> Copy
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href="/sitemap.xml" target="_blank" rel="noreferrer">Open</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Robots */}
        <div className="space-y-2">
          <Label htmlFor="seo-robots">robots.txt URL</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="seo-robots" readOnly value={robotsUrl} className="flex-1 font-mono text-xs" />
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" onClick={() => copy(robotsUrl, "robots.txt URL")}>
                <AppIcon name="copy" size={15} /> Copy
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href="/robots.txt" target="_blank" rel="noreferrer">Open</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Submission links */}
        <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">Submit to search engines</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline"
              >
                Google Search Console
              </a>{" "}
              — verify your site (paste the HTML-tag verification code into Site settings
              above), then add the sitemap URL under Sitemaps.
            </li>
            <li>
              <a
                href="https://www.bing.com/webmasters"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline"
              >
                Bing Webmaster Tools
              </a>{" "}
              — add the sitemap URL above (also powers Bing &amp; DuckDuckGo).
              Content changes also auto-notify Bing via IndexNow.
            </li>
          </ul>
        </div>

        {/* Live sitemap preview */}
        <div className="space-y-2">
          <Label>Indexed URLs (from the live sitemap)</Label>
          {urls === null ? (
            <p className="text-xs text-muted-foreground">Loading sitemap…</p>
          ) : urls.length === 0 ? (
            <p className="text-xs text-muted-foreground">Could not load the sitemap.</p>
          ) : (
            <div className="max-h-44 overflow-y-auto rounded-lg border bg-muted/30 p-2">
              <ul className="space-y-1 text-[11px] text-muted-foreground">
                {urls.slice(0, 40).map((u) => (
                  <li key={u} className="truncate">
                    {u}
                  </li>
                ))}
                {urls.length > 40 && <li>… and {urls.length - 40} more</li>}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
