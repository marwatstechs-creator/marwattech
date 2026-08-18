"use client";

import * as React from "react";

function inlineMd(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {p.slice(1, -1)}
        </code>
      );
    }
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

/**
 * Tiny, safe markdown renderer (no dangerouslySetInnerHTML). Supports
 * headings, bullets, fenced code blocks, inline code and bold — enough for
 * AI-generated slide content and chat replies.
 */
export function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listBuf: string[] = [];

  const flushList = (key: string) => {
    if (!listBuf.length) return;
    out.push(
      <ul key={key} className="my-2 list-disc space-y-1 pl-5">
        {listBuf.map((li, i) => (
          <li key={i}>{inlineMd(li)}</li>
        ))}
      </ul>
    );
    listBuf = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith("```")) {
      if (inCode) {
        out.push(
          <pre key={`c${i}`} className="my-2 overflow-x-auto rounded-lg border bg-muted p-3 text-sm">
            <code>{codeBuf.join("\n")}</code>
          </pre>
        );
        codeBuf = [];
        inCode = false;
      } else {
        flushList(`l${i}`);
        inCode = true;
      }
      return;
    }
    if (inCode) {
      codeBuf.push(line);
      return;
    }
    if (/^\s*[-*] /.test(line)) {
      listBuf.push(line.replace(/^\s*[-*] /, ""));
      return;
    }
    flushList(`l${i}`);
    if (/^###?\s+/.test(line)) {
      const txt = line.replace(/^#{1,3}\s+/, "");
      out.push(
        <h3 key={i} className="mt-3 mb-1 font-semibold">
          {inlineMd(txt)}
        </h3>
      );
      return;
    }
    if (!line.trim()) return;
    out.push(
      <p key={i} className="my-1.5">
        {inlineMd(line)}
      </p>
    );
  });
  flushList("last");
  if (inCode && codeBuf.length) {
    out.push(
      <pre key="trail" className="my-2 overflow-x-auto rounded-lg border bg-muted p-3 text-sm">
        <code>{codeBuf.join("\n")}</code>
      </pre>
    );
  }
  return <div>{out}</div>;
}
