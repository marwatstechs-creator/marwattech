"use client";

import { useEffect, useMemo, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { AutoLinkPlugin, createLinkMatcherWithRegExp } from "@lexical/react/LexicalAutoLinkPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $createParagraphNode,
  $getRoot,
  ParagraphNode,
  TextNode,
} from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { ImageNode } from "./nodes/ImageNode";
import { YouTubeNode } from "./nodes/YouTubeNode";
import { CheckListNode, CheckListItemNode } from "./nodes/CheckList";
import { EditorToolbar } from "./Toolbar";
import SlashMenuPlugin from "./plugins/SlashMenuPlugin";
import CheckListPlugin from "./plugins/CheckListPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import ImagePastePlugin from "./plugins/ImagePastePlugin";
import { isJsonContent } from "./utils";

const EDITOR_NODES = [
  ParagraphNode,
  TextNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  LinkNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HorizontalRuleNode,
  ImageNode,
  YouTubeNode,
  CheckListNode,
  CheckListItemNode,
];

/* ── Theme (design-token driven, light & dark) ──────────────────── */

const theme = {
  root: "lexical-root prose-cms max-w-none px-4 py-4 focus:outline-none",
  paragraph: "my-1.5",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline underline-offset-2",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]",
  },
  heading: {
    h1: "mb-2 mt-5 text-3xl font-bold",
    h2: "mb-2 mt-5 text-2xl font-bold",
    h3: "mb-1.5 mt-4 text-xl font-semibold",
    h4: "mb-1.5 mt-3 text-lg font-semibold",
  },
  quote: "my-3 border-l-4 border-primary/60 pl-4 italic text-muted-foreground",
  list: {
    ul: "my-3 list-disc pl-6",
    ol: "my-3 list-decimal pl-6",
    listitem: "my-1 leading-relaxed",
    nested: { listitem: "" },
  },
  code: "my-3 block overflow-x-auto whitespace-pre rounded-lg border bg-muted p-3 font-mono text-sm leading-relaxed",
  codeHighlight: {
    atrule: "text-red-500",
    attr: "text-sky-600 dark:text-sky-400",
    boolean: "text-emerald-600 dark:text-emerald-400",
    builtin: "text-purple-600 dark:text-purple-400",
    cdata: "text-muted-foreground",
    char: "text-orange-500",
    class: "text-purple-600 dark:text-purple-400",
    className: "text-purple-600 dark:text-purple-400",
    comment: "text-muted-foreground italic",
    constant: "text-emerald-600 dark:text-emerald-400",
    deleted: "text-red-500",
    doctype: "text-muted-foreground",
    entity: "text-orange-500",
    function: "text-sky-600 dark:text-sky-400",
    important: "font-bold",
    inserted: "text-emerald-600 dark:text-emerald-400",
    keyword: "text-purple-600 dark:text-purple-400",
    namespace: "text-muted-foreground",
    number: "text-orange-500",
    operator: "text-muted-foreground",
    prolog: "text-muted-foreground",
    property: "text-sky-600 dark:text-sky-400",
    punctuation: "text-muted-foreground",
    regex: "text-red-500",
    selector: "text-emerald-600 dark:text-emerald-400",
    string: "text-emerald-600 dark:text-emerald-400",
    symbol: "text-purple-600 dark:text-purple-400",
    tag: "text-red-500",
    url: "text-sky-600 dark:text-sky-400",
    variable: "text-amber-600 dark:text-amber-400",
  },
  link: "text-primary underline underline-offset-2 hover:text-primary/80",
  horizontalrule: "my-4 border-border",
  table: "my-4 w-full border-collapse",
  tableCell: "border border-border px-3 py-2 align-top",
  tableCellHeader: "border border-border bg-muted px-3 py-2 font-semibold",
  tableRow: "",
  tableCellActionButton: "bg-muted border border-border p-1",
  tableCellResizer: "bg-primary",
  tableSelection: "bg-primary/20",
  image: "my-3",
  youtube: "my-3",
  mark: "bg-yellow-200 text-black dark:bg-yellow-300/80 dark:text-black",
};

/* ── Loads JSON or legacy HTML into the editor ──────────────────── */

function ValueSyncPlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const lastApplied = useRef<string>("");

  useEffect(() => {
    if (!value || value === lastApplied.current) return;

    if (isJsonContent(value)) {
      try {
        editor.setEditorState(editor.parseEditorState(value));
        lastApplied.current = value;
        return;
      } catch {
        // fall through to HTML import
      }
    }

    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const parser = new DOMParser();
      const dom = parser.parseFromString(value, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const block = $createParagraphNode();
      nodes.forEach((n) => block.append(n));
      root.append(block);
      root.append($createParagraphNode());
      lastApplied.current = value;
    });
  }, [editor, value]);

  return null;
}

/* ── Serializes changes out to the parent form ──────────────────── */

function OnChangePlugin({
  onChange,
  onHtmlChange,
  output,
}: {
  onChange: (value: string) => void;
  onHtmlChange?: (html: string) => void;
  output: "json" | "html";
}) {
  const [editor] = useLexicalComposerContext();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onHtmlRef = useRef(onHtmlChange);
  onHtmlRef.current = onHtmlChange;

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
      if (output === "html") {
        const html = editorState.read(() => $generateHtmlFromNodes(editor, null));
        onChangeRef.current(html);
      } else {
        onChangeRef.current(JSON.stringify(editorState.toJSON()));
      }
      if (onHtmlRef.current) {
        const html = editorState.read(() => $generateHtmlFromNodes(editor, null));
        onHtmlRef.current(html);
      }
    });
  }, [editor, output]);

  return null;
}

/* ── Public API ─────────────────────────────────────────────────── */

export type EditorFeatures = {
  images?: boolean;
  tables?: boolean;
  codeBlocks?: boolean;
  embeds?: boolean;
  slashCommands?: boolean;
  links?: boolean;
};

export function RichTextEditor({
  value = "",
  onChange,
  onHtmlChange,
  placeholder = "Start writing…",
  minHeight = 280,
  output = "json",
  mode = "general",
  features = {},
}: {
  value?: string;
  onChange: (value: string) => void;
  onHtmlChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  output?: "json" | "html";
  mode?: "blog" | "page" | "source-code" | "general";
  features?: EditorFeatures;
}) {
  const f = useMemo(
    () => ({
      images: features.images ?? true,
      tables: features.tables ?? true,
      codeBlocks: features.codeBlocks ?? true,
      embeds: features.embeds ?? true,
      slashCommands: features.slashCommands ?? true,
      links: features.links ?? true,
    }),
    [features]
  );

  const initialConfig = useMemo(() => {
    const isJson = isJsonContent(value);
    return {
      namespace: `lexical-${mode}`,
      theme,
      nodes: EDITOR_NODES,
      onError: (err: Error) => {
        console.error("[lexical] editor error:", err);
      },
      editorState: isJson ? value : undefined,
    };
  }, [value, mode]);

  return (
    <div className="overflow-hidden rounded-xl border bg-card" style={{ minHeight }}>
      <LexicalComposer initialConfig={initialConfig}>
        <EditorToolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={placeholder}
              className="lexical-editable min-h-[280px] focus:outline-none"
              style={{ minHeight }}
            />
          }
          placeholder={
            <div className="pointer-events-none absolute top-0 px-4 py-4 text-muted-foreground/70">
              {placeholder}
            </div>
          }
          ErrorBoundary={EditorErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        {f.links && <LinkPlugin />}
        {f.links && <AutoLinkPlugin matchers={urlMatchers} />}
        {f.tables && <TablePlugin hasCellMerge hasCellBackgroundColor={false} />}
        {f.codeBlocks && <CodeHighlightPlugin />}
        {f.images && <ImagePastePlugin />}
        <CheckListPlugin />
        {f.slashCommands && <SlashMenuPlugin />}
        <ValueSyncPlugin value={value} />
        <OnChangePlugin onChange={onChange} onHtmlChange={onHtmlChange} output={output} />
      </LexicalComposer>
    </div>
  );
}

function EditorErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const urlMatchers = [
  createLinkMatcherWithRegExp(/(https?:\/\/|www\.)([^\s<]+)/i, (text: string) =>
    text.startsWith("www.") ? `https://${text}` : text
  ),
];
