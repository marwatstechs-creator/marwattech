import * as React from "react";
import { CodeBlockViewer } from "./CodeBlockViewer";

/* ── Types ──────────────────────────────────────────────────────── */

type LexNode = {
  children?: LexNode[];
  direction?: string | null;
  format?: number | string;
  indent?: number;
  type: string;
  version?: number;
  [key: string]: unknown;
};

/* ── Helpers ────────────────────────────────────────────────────── */

const ALIGN_MAP: Record<number, string> = { 1: "left", 2: "center", 3: "right", 4: "justify" };

function getAlign(node: LexNode): string | undefined {
  const fmt = node.format;
  if (typeof fmt === "number" && fmt > 0) return ALIGN_MAP[fmt];
  if (typeof fmt === "string" && fmt) return ALIGN_MAP[Number(fmt)];
  return undefined;
}

function collectText(node: LexNode): string {
  if (node.type === "text") return String(node.text ?? "");
  return (node.children ?? []).map(collectText).join("");
}

function parseStyle(style: string | undefined): React.CSSProperties {
  const out: React.CSSProperties = {};
  if (!style) return out;
  for (const part of style.split(";")) {
    const [k, ...rest] = part.split(":");
    const key = k?.trim().toLowerCase();
    const val = rest.join(":").trim();
    if (!key || !val) continue;
    if (key === "color") out.color = val;
    if (key === "background-color") out.backgroundColor = val;
  }
  return out;
}

/* ── Text rendering ─────────────────────────────────────────────── */

function renderText(node: LexNode, key: number): React.ReactNode {
  const text = String(node.text ?? "");
  const format = typeof node.format === "number" ? node.format : 0;
  const style = parseStyle(node.style as string | undefined);

  let content: React.ReactNode = text;

  if (format & 16) {
    content = <code key="code" className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{content}</code>;
  }
  if (format & 2) content = <em key="em">{content}</em>;
  if (format & 4) content = <u key="u">{content}</u>;
  if (format & 8) content = <s key="s">{content}</s>;
  if (format & 1) content = <strong key="b">{content}</strong>;
  if (format & 32) content = <sub key="sub">{content}</sub>;
  if (format & 64) content = <sup key="sup">{content}</sup>;

  if (Object.keys(style).length) {
    content = <span key="style" style={style}>{content}</span>;
  }
  return <React.Fragment key={key}>{content}</React.Fragment>;
}

/* ── Node dispatch ──────────────────────────────────────────────── */

function renderNode(node: LexNode, key: number): React.ReactNode {
  switch (node.type) {
    case "root":
      return <div key={key}>{renderChildren(node)}</div>;

    case "paragraph": {
      const align = getAlign(node);
      return (
        <p key={key} style={align ? { textAlign: align as React.CSSProperties["textAlign"] } : undefined}>
          {renderChildren(node)}
        </p>
      );
    }

    case "heading": {
      const tag = String(node.tag ?? "h2");
      const align = getAlign(node);
      const style = align ? { textAlign: align as React.CSSProperties["textAlign"] } : undefined;
      if (tag === "h1") return <h1 key={key} style={style}>{renderChildren(node)}</h1>;
      if (tag === "h2") return <h2 key={key} style={style}>{renderChildren(node)}</h2>;
      if (tag === "h3") return <h3 key={key} style={style}>{renderChildren(node)}</h3>;
      return <h4 key={key} style={style}>{renderChildren(node)}</h4>;
    }

    case "quote":
      return <blockquote key={key} className="my-3 border-l-4 border-primary/60 pl-4 italic text-muted-foreground">{renderChildren(node)}</blockquote>;

    case "code": {
      const code = collectText(node);
      const language = (node.language as string | null) || null;
      return <CodeBlockViewer key={key} code={code} language={language} />;
    }

    case "list": {
      const tag = String(node.tag ?? "ul");
      const attrs = tag === "ol" ? { start: node.start as number | undefined } : {};
      return tag === "ol"
        ? <ol key={key} start={attrs.start} className="my-3 list-decimal pl-6">{renderChildren(node)}</ol>
        : <ul key={key} className="my-3 list-disc pl-6">{renderChildren(node)}</ul>;
    }

    case "listitem":
      return <li key={key} className="my-1 leading-relaxed">{renderChildren(node)}</li>;

    case "checklist":
      return <ul key={key} className="my-3 space-y-1.5">{renderChildren(node)}</ul>;

    case "checklist-item": {
      const checked = Boolean(node.checked);
      return (
        <li key={key} className="flex items-start gap-2">
          <span
            aria-hidden
            className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px]"
            style={{
              background: checked ? "var(--color-primary)" : "transparent",
              borderColor: checked ? "var(--color-primary)" : "var(--color-border)",
            }}
          >
            {checked ? "✓" : ""}
          </span>
          <span className={checked ? "text-muted-foreground line-through" : undefined}>{renderChildren(node)}</span>
        </li>
      );
    }

    case "link": {
      const href = String(node.url ?? "#");
      const target = node.target as string | undefined;
      const rel = node.rel as string | undefined;
      return (
        <a key={key} href={href} target={target} rel={rel || "noopener noreferrer"} className="text-primary underline underline-offset-2 hover:text-primary/80">
          {renderChildren(node)}
        </a>
      );
    }

    case "autolink": {
      const href = String(node.url ?? "#");
      return (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
          {renderChildren(node)}
        </a>
      );
    }

    case "image": {
      const src = String(node.src ?? "");
      const alt = String(node.altText ?? "");
      const width = node.width as number | null | undefined;
      const caption = String(node.caption ?? "");
      const align = node.align as string | undefined;
      const wrapStyle: React.CSSProperties = {
        textAlign: align === "right" ? "right" : align === "left" ? "left" : "center",
      };
      return (
        <figure key={key} className="my-4" style={wrapStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="mx-auto max-w-full rounded-lg"
            style={width ? { width: `${width}px`, maxWidth: "100%" } : undefined}
          />
          {caption && <figcaption className="mt-1 text-center text-xs text-muted-foreground">{caption}</figcaption>}
        </figure>
      );
    }

    case "youtube": {
      const id = String(node.videoID ?? "");
      return (
        <div key={key} className="my-4 overflow-hidden rounded-xl border bg-muted/40 p-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <iframe
              src={`https://www.youtube.com/embed/${id}`}
              title="YouTube video player"
              className="absolute inset-0 h-full w-full"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );
    }

    case "table":
      return (
        <div key={key} className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">{renderChildren(node)}</table>
        </div>
      );

    case "tablerow":
      return <tr key={key}>{renderChildren(node)}</tr>;

    case "tablecell":
    case "tableheader": {
      const headerState = Number(node.headerState ?? 0);
      const isHeader = node.type === "tableheader" || (headerState & 1) === 1;
      const Tag = isHeader ? "th" : "td";
      return (
        <Tag
          key={key}
          colSpan={Number(node.colSpan ?? 1)}
          rowSpan={Number(node.rowSpan ?? 1)}
          className="border border-border px-3 py-2 align-top"
        >
          {renderChildren(node)}
        </Tag>
      );
    }

    case "horizontalrule":
      return <hr key={key} className="my-4 border-border" />;

    case "text":
      return renderText(node, key);

    case "code-highlight":
      return renderText(node, key);

    default:
      return <React.Fragment key={key}>{renderChildren(node)}</React.Fragment>;
  }
}

function renderChildren(node: LexNode): React.ReactNode[] {
  return (node.children ?? []).map((child, i) => renderNode(child, i));
}

/** Render a Lexical JSON editor state into React nodes (server-safe). */
export function renderLexicalJson(json: unknown): React.ReactNode {
  if (!json || typeof json !== "object") return null;
  const root = (json as { root?: LexNode }).root;
  if (!root) return null;
  return renderNode(root, 0);
}
