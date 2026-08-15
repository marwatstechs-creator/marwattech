import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";

/**
 * Injects user-provided <head> code (Admin → Settings → "Custom head code")
 * into every page. This is the simple "paste your Google tag / verification
 * snippet here and it lands in the <head>" box.
 *
 * Supports: <script src>, inline <script>, <meta>, <link> and <style> tags.
 *
 * IMPORTANT (no Suspense): this component is intentionally NOT wrapped in
 * <Suspense>. Suspense would stream it in AFTER </head>, so the literal
 * <script> tags would land in the <body> — and Google's tag-detection checker
 * scans the <head> and would report "not detected". Rendering it as a plain
 * async server component puts the tags inside the actual <head>.
 */
async function HeadCodeContent() {
  let code = "";
  try {
    const db = await createClient();
    const settings = await getSiteSettings(db);
    code = settings.custom_head_code?.trim() ?? "";
  } catch {
    // no code when settings can't be read
  }
  if (!code) return null;
  return <ParsedHeadCode html={code} />;
}

function parseAttrs(attrs: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z0-9-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrs)) !== null) {
    out[m[1]] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return out;
}

function ParsedHeadCode({ html }: { html: string }) {
  const nodes: React.ReactNode[] = [];
  let key = 0;
  // Match any <tag attrs>...</tag> (or self-closing) — handles script/meta/link/style.
  const tagRe = /<([a-zA-Z0-9-]+)((?:\s+[^<>]*?)?)\s*\/?>(?:([\s\S]*?)<\/\1>)?/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = parseAttrs(m[2] ?? "");
    const inner = m[3] ?? "";
    if (tag === "script") {
      if (attrs.src) {
        // Literal <script src> in the SSR HTML so Google's detector sees it.
        nodes.push(
          // eslint-disable-next-line react/no-danger
          <script
            key={key++}
            src={attrs.src}
            {...(attrs.async !== undefined ? { async: true } : {})}
          />
        );
      } else if (inner.trim()) {
        // Literal inline <script> in the SSR HTML (executes on load).
        nodes.push(
          // eslint-disable-next-line react/no-danger
          <script
            key={key++}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: inner }}
          />
        );
      }
    } else if (tag === "meta") {
      nodes.push(<meta key={key++} {...(attrs as React.HTMLAttributes<HTMLMetaElement>)} />);
    } else if (tag === "link") {
      nodes.push(<link key={key++} {...(attrs as React.HTMLAttributes<HTMLLinkElement>)} />);
    } else if (tag === "style") {
      nodes.push(
        <style key={key++} dangerouslySetInnerHTML={{ __html: inner }} />
      );
    }
    // Any other head tags are intentionally ignored.
  }
  return <>{nodes}</>;
}

export async function CustomHeadCode() {
  return <HeadCodeContent />;
}
