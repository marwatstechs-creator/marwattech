import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { renderLexicalJson } from "./render";

function looksLikeLexical(json: unknown): boolean {
  if (!json) return false;
  if (typeof json === "string") {
    const t = json.trim();
    if (!t.startsWith("{")) return false;
    try {
      const parsed = JSON.parse(t) as { root?: unknown };
      return !!parsed && typeof parsed === "object" && !!parsed.root;
    } catch {
      return false;
    }
  }
  if (typeof json === "object") {
    return !!((json as { root?: unknown }).root);
  }
  return false;
}

/**
 * Renders CMS content on public pages.
 * - Prefers Lexical JSON (rendered as React components — no unsafe HTML).
 * - Falls back to sanitized HTML for legacy content stored before the
 *   Lexical migration, so existing posts/pages keep rendering identically.
 */
export function EditorContent({
  content,
  contentJson,
  className,
}: {
  content: string | null;
  contentJson?: unknown;
  className?: string;
}) {
  if (looksLikeLexical(contentJson)) {
    try {
      const parsed =
        typeof contentJson === "string"
          ? (JSON.parse(contentJson) as { root?: unknown })
          : (contentJson as { root?: unknown });
      return <div className={cn("prose-cms", className)}>{renderLexicalJson(parsed)}</div>;
    } catch {
      // fall through to HTML
    }
  }

  const html = sanitizeHtml(content ?? "");
  return <div className={cn("prose-cms", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
