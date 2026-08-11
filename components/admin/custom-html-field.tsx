"use client";

import { AppIcon } from "@/components/app-icon";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Raw HTML / CSS / JS editor for blog posts & pages.
 * Content is stored verbatim and rendered as-is (un-sanitized) on the
 * published page, so <style>, <script> and custom markup all work.
 */
export function CustomHtmlField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center gap-2">
          <AppIcon name="code" size={16} className="text-primary" />
          <h2 className="font-display text-lg font-bold">Custom HTML / CSS / JS</h2>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Paste raw HTML, CSS and JavaScript — rendered exactly as-is on the
          published page (below the rich content). Useful for custom widgets,
          styled sections, embeds and scripts.
        </p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder={'<style>\n  .my-widget { color: red; }\n</style>\n\n<div class="my-widget">Hello</div>\n\n<script>\n  // your JavaScript here\n</script>'}
          className="min-h-[240px] w-full resize-y rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
      </CardContent>
    </Card>
  );
}
