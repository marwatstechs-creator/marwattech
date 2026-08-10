import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize rich-text HTML coming from the admin CMS before it is rendered
 * to public visitors (XSS protection — NFR-8).
 */
export function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "iframe", "form", "input", "script"],
    FORBID_ATTR: ["style", "onerror", "onclick", "onload"],
  });
}
