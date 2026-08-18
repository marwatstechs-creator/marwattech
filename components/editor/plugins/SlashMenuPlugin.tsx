"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  createCommand,
  type LexicalCommand,
} from "lexical";
import { $createCodeNode } from "@lexical/code";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { cn } from "@/lib/utils";
import { INSERT_CHECK_LIST_COMMAND } from "./CheckListPlugin";
import { getYouTubeId, insertImageAtSelection, insertYouTubeAtSelection, uploadToStorage } from "../utils";

export const INSERT_IMAGE_FROM_SLASH_COMMAND: LexicalCommand<undefined> =
  createCommand("INSERT_IMAGE_FROM_SLASH_COMMAND");

type SlashItem = {
  title: string;
  group: string;
  keywords: string[];
  icon: string;
  run: () => void;
};

function $cleanupSlashText(): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  const node = selection.anchor.getNode();
  if (!$isTextNode(node)) return;
  const text = node.getTextContent();
  const caret = selection.anchor.offset;
  const before = text.slice(0, caret);
  const m = before.match(/(^|\s)\/([A-Za-z]*)$/);
  if (!m) return;
  const start = m[1] === " " ? caret - m[0].length + 1 : caret - m[0].length;
  node.spliceText(start, caret - start, "", true);
}

export default function SlashMenuPlugin({
  onRequestImageUpload,
}: {
  onRequestImageUpload?: () => void;
}): React.ReactElement {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SlashItem[]>([]);
  const [active, setActive] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const setBlockType = useCallback(
    (type: "p" | "h1" | "h2" | "h3" | "quote" | "code") => {
      editor.update(() => {
        const sel = $getSelection();
        if (!sel) return;
        if (type === "p") $setBlocksType(sel, () => $createParagraphNode());
        else if (type === "quote") $setBlocksType(sel, () => $createQuoteNode());
        else if (type === "code") $setBlocksType(sel, () => $createCodeNode());
        else $setBlocksType(sel, () => $createHeadingNode(type.slice(1) as HeadingTagType));
      });
    },
    [editor]
  );

  const buildItems = useCallback((): SlashItem[] => {
    return [
      { group: "Basic Blocks", title: "Heading 1", keywords: ["h1", "heading", "title"], icon: "H1", run: () => setBlockType("h1") },
      { group: "Basic Blocks", title: "Heading 2", keywords: ["h2", "heading"], icon: "H2", run: () => setBlockType("h2") },
      { group: "Basic Blocks", title: "Heading 3", keywords: ["h3", "heading"], icon: "H3", run: () => setBlockType("h3") },
      { group: "Basic Blocks", title: "Paragraph", keywords: ["p", "text", "body"], icon: "¶", run: () => setBlockType("p") },
      { group: "Basic Blocks", title: "Quote", keywords: ["quote", "blockquote", "citation"], icon: "❝", run: () => setBlockType("quote") },
      { group: "Basic Blocks", title: "Divider", keywords: ["divider", "hr", "line", "separator"], icon: "—", run: () => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined) },
      { group: "Lists", title: "Bulleted list", keywords: ["ul", "bulleted", "unordered", "list"], icon: "•", run: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined) },
      { group: "Lists", title: "Numbered list", keywords: ["ol", "numbered", "ordered", "list"], icon: "1.", run: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined) },
      { group: "Lists", title: "Checklist", keywords: ["check", "todo", "task"], icon: "☑", run: () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined) },
      { group: "Media", title: "Image", keywords: ["image", "img", "photo", "picture", "upload"], icon: "🖼", run: () => {
        if (onRequestImageUpload) onRequestImageUpload();
        else fileRef.current?.click();
      } },
      { group: "Media", title: "YouTube", keywords: ["youtube", "video", "embed"], icon: "▶", run: () => {
        const url = window.prompt("YouTube video URL or ID");
        const id = getYouTubeId(url ?? "");
        if (id) insertYouTubeAtSelection(editor, id);
      } },
      { group: "Advanced", title: "Code block", keywords: ["code", "pre", "snippet", "script"], icon: "</>", run: () => setBlockType("code") },
    ];
  }, [editor, onRequestImageUpload, setBlockType]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        setOpen(false);
        return;
      }
      const node = selection.anchor.getNode();
      if (!$isTextNode(node)) {
        setOpen(false);
        return;
      }
      const text = node.getTextContent();
      const caret = selection.anchor.offset;
      const before = text.slice(0, caret);
      const m = before.match(/(^|\s)\/([A-Za-z]*)$/);
      if (m) {
        const q = m[2];
        setQuery(q);
        const filtered = buildItems().filter((it) =>
          [it.title, ...it.keywords, it.group].some((s) => s.toLowerCase().includes(q.toLowerCase()))
        );
        setItems(filtered);
        setActive(0);
        setOpen(filtered.length > 0);
      } else {
        setOpen(false);
      }
    });
  }, [editor, buildItems]);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const el = containerRef.current;
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        el.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 300))}px`;
        el.style.top = `${rect.bottom + 6}px`;
      }
    } catch {
      // ignore
    }
  }, [open, query]);

  function runItem(item: SlashItem) {
    setOpen(false);
    editor.update(() => $cleanupSlashText());
    item.run();
    editor.focus();
  }

  async function onPickFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const res = await uploadToStorage(file, "editor");
    if (res.error) return;
    insertImageAtSelection(editor, res.url, file.name);
  }

  useEffect(() => {
    if (!open) return;
    const nav = (delta: number) => {
      setActive((a) => (a + delta + items.length) % items.length);
      return true;
    };
    const unsubs = [
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, () => nav(1), COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, () => nav(-1), COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_TAB_COMMAND, () => nav(1), COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ENTER_COMMAND, () => {
        const it = items[active];
        if (it) runItem(it);
        return true;
      }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, () => {
        setOpen(false);
        return true;
      }, COMMAND_PRIORITY_LOW),
    ];
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items, active, editor]);

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPickFile(e.target.files);
          e.target.value = "";
        }}
      />
      {open && (
        <div
          ref={containerRef}
          className="editor-slash-menu fixed z-50 max-h-72 w-72 overflow-y-auto rounded-xl border bg-popover p-1.5 shadow-xl"
          style={{ left: 0, top: 0 }}
        >
          {items.map((it, i) => (
            <button
              key={it.group + it.title}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                runItem(it);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm",
                i === active ? "bg-accent text-accent-foreground" : "text-foreground"
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
                {it.icon}
              </span>
              <span>
                <span className="block font-medium">{it.title}</span>
                <span className="block text-[11px] text-muted-foreground">{it.group}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
