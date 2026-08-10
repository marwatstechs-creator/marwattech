import sanitize from "sanitize-html";

/**
 * Sanitize rich-text HTML coming from the admin CMS before it is rendered
 * to public visitors (XSS protection — NFR-8).
 *
 * Uses `sanitize-html` (Node, no jsdom) instead of `isomorphic-dompurify`
 * to keep the Cloudflare Worker bundle well under the 3 MiB free-tier limit.
 */
export function sanitizeHtml(html: string) {
  return sanitize(html, {
    allowedTags: sanitize.defaults.allowedTags.concat(["img"]),
    allowedAttributes: Object.assign({}, sanitize.defaults.allowedAttributes, {
      img: ["src", "alt", "title", "width", "height"],
    }),
    allowedSchemes: ["http", "https", "mailto", "tel"],
  });
}
