import type { ReactNode } from "react";

type JsonLd = Record<string, unknown>;

/**
 * Renders schema.org JSON-LD <script> tags. Accepts one object or an array
 * of objects (rendered as separate script tags, the recommended pattern).
 */
export function JsonLd({ data }: { data: JsonLd | JsonLd[] }): ReactNode {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
