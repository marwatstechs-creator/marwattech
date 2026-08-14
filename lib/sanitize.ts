import sanitize from "sanitize-html";

/**
 * Sanitize rich-text HTML coming from the admin CMS before it is rendered
 * to public visitors (XSS protection).
 *
 * Uses `sanitize-html` (Node, no jsdom) instead of `isomorphic-dompurify`
 * to keep the Cloudflare Worker bundle well under the 3 MiB free-tier limit.
 *
 * The whitelist is tuned for the Tiptap editor output so nothing a writer
 * creates is silently stripped on the public pages: H1–H2, underlines,
 * highlights, text colors/alignment, task lists, tables, code blocks,
 * images and YouTube embeds all survive — while scripts and event
 * handlers are still removed.
 */

const EXTRA_TAGS = [
  "h1",
  "h2",
  "img",
  "iframe",
  "mark",
  "s",
  "u",
  "span",
  "input",
  "label",
  "figure",
  "figcaption",
  "sub",
  "sup",
  "section",
  "article",
];

const EXTRA_ATTRS: Record<string, string[]> = {
  // Every tag may carry Tiptap bookkeeping attributes + inline styles
  // (text color, alignment, background highlight, table widths).
  "*": [
    "class",
    "style",
    "data-type",
    "data-checked",
    "data-placeholder",
    "data-youtube-video",
  ],
  img: ["src", "alt", "title", "width", "height", "loading"],
  iframe: [
    "src",
    "width",
    "height",
    "frameborder",
    "allowfullscreen",
    "allow",
    "autoplay",
    "title",
    "name",
  ],
  input: ["type", "checked", "disabled"],
  a: ["href", "name", "target", "rel"],
  td: ["colspan", "rowspan", "style"],
  th: ["colspan", "rowspan", "style"],
};

export function sanitizeHtml(html: string) {
  return sanitize(html, {
    allowedTags: Array.from(new Set([...sanitize.defaults.allowedTags, ...EXTRA_TAGS])),
    allowedAttributes: Object.assign(
      {},
      sanitize.defaults.allowedAttributes,
      EXTRA_ATTRS
    ),
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { iframe: ["http", "https"] },
    // Only allow embedded video hosts, so an author can't inject arbitrary
    // iframes (e.g. phishing frames) into published content.
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "www.youtube-nocookie.com",
      "youtube-nocookie.com",
      "player.vimeo.com",
    ],
  });
}
