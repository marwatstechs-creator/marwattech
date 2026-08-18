"use client";

import * as React from "react";
import { createLowlight, common } from "lowlight";
import { AppIcon } from "@/components/app-icon";

const lowlight = createLowlight(common);

type HastNode = {
  type: string;
  tagName?: string;
  properties?: { className?: string[] | string };
  value?: string;
  children?: HastNode[];
};

function hastToReact(node: HastNode, key: number): React.ReactNode {
  if (node.type === "text") return node.value;
  const cls = Array.isArray(node.properties?.className)
    ? node.properties.className.join(" ")
    : typeof node.properties?.className === "string"
      ? node.properties.className
      : "";
  return (
    <span key={key} className={cls}>
      {node.children?.map((c, i) => hastToReact(c, i))}
    </span>
  );
}

/** Server-renderable (Next SSRs client components) highlighted code block. */
export function CodeBlockViewer({ code, language }: { code: string; language?: string | null }) {
  const [copied, setCopied] = React.useState(false);
  const lang = (language || "plaintext").toLowerCase();
  const normalized = code.replace(/\n$/, "");
  const lines = normalized.split("\n");

  let highlighted: React.ReactNode = null;
  try {
    const tree = lowlight.highlight(lang, normalized) as unknown as HastNode;
    highlighted = (tree.children as HastNode[]).map((c, i) => hastToReact(c, i));
  } catch {
    highlighted = normalized;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(normalized);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <figure className="group my-4 overflow-hidden rounded-xl border bg-muted/60">
      <figcaption className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5">
        <span className="truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {lang}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] text-muted-foreground transition hover:text-foreground"
        >
          <AppIcon name={copied ? "check" : "copy"} size={13} />
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <div className="flex max-h-[480px] overflow-auto">
        {/* Line numbers */}
        <div
          aria-hidden
          className="select-none border-r border-border bg-muted/40 px-2 py-3 text-right font-mono text-xs leading-relaxed text-muted-foreground/60"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="flex-1 overflow-x-auto p-3 font-mono text-[13px] leading-relaxed">
          <code className={`language-${lang} block whitespace-pre`}>{highlighted}</code>
        </pre>
      </div>
    </figure>
  );
}
