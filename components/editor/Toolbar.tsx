"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootNode,
  $isTextNode,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type ElementFormatType,
} from "lexical";
import { $createCodeNode, $isCodeNode, getCodeLanguageOptions, type CodeNode } from "@lexical/code";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $setBlocksType } from "@lexical/selection";
import {
  INSERT_TABLE_COMMAND,
  TableCellNode,
  TableNode,
  TableRowNode,
  $createTableCellNode,
  $createTableRowNode,
  $isTableCellNode,
} from "@lexical/table";
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from "@lexical/rich-text";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";
import { INSERT_CHECK_LIST_COMMAND, $isCheckListNode } from "./plugins/CheckListPlugin";
import { getYouTubeId, insertImageAtSelection, insertYouTubeAtSelection, uploadToStorage } from "./utils";

/* ── Tiny UI primitives ─────────────────────────────────────────── */

function TBtn({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid h-8 min-w-8 shrink-0 place-items-center rounded-md px-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-foreground/80 hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function TDivider() {
  return <span className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block" />;
}

function Dropdown({
  trigger,
  children,
  align = "left",
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className="grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
      >
        {trigger}
      </button>
      {open && (
        <div
          className={cn(
            "absolute z-40 mt-1 max-h-72 w-52 overflow-y-auto rounded-lg border bg-popover p-1.5 shadow-xl",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/* ── Table helpers ──────────────────────────────────────────────── */

function $getActiveTableCell(): TableCellNode | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const anchor = selection.anchor.getNode();
  const found = $findMatchingParent(anchor, $isTableCellNode);
  return found instanceof TableCellNode ? found : null;
}

function $addRow(before: boolean) {
  const cell = $getActiveTableCell();
  if (!cell) return;
  const row = cell.getParent();
  if (!(row instanceof TableRowNode)) return;
  const newRow = $createTableRowNode();
  row.getChildren().forEach((c) => {
    const cc = c as TableCellNode;
    newRow.append($createTableCellNode(cc.getHeaderStyles(), cc.getColSpan(), cc.getRowSpan()));
  });
  if (before) row.insertBefore(newRow);
  else row.insertAfter(newRow);
}

function $deleteRow() {
  const cell = $getActiveTableCell();
  if (!cell) return;
  const row = cell.getParent();
  if (row instanceof TableRowNode) row.remove();
}

function $addColumn(before: boolean) {
  const cell = $getActiveTableCell();
  if (!cell) return;
  const row = cell.getParent();
  if (!(row instanceof TableRowNode)) return;
  const table = $findMatchingParent(row, (n) => n instanceof TableNode);
  if (!(table instanceof TableNode)) return;
  const idx = cell.getIndexWithinParent();
  table.getChildren().forEach((r) => {
    const rowNode = r as TableRowNode;
    const cells = rowNode.getChildren();
    const refCell = cells[idx] as TableCellNode | undefined;
    if (!refCell) return;
    const newCell = $createTableCellNode(refCell.getHeaderStyles(), 1, 1);
    if (before) refCell.insertBefore(newCell);
    else refCell.insertAfter(newCell);
  });
}

function $deleteColumn() {
  const cell = $getActiveTableCell();
  if (!cell) return;
  const row = cell.getParent();
  if (!(row instanceof TableRowNode)) return;
  const table = $findMatchingParent(row, (n) => n instanceof TableNode);
  if (!(table instanceof TableNode)) return;
  const idx = cell.getIndexWithinParent();
  table.getChildren().forEach((r) => {
    const rowNode = r as TableRowNode;
    const c = rowNode.getChildren()[idx] as TableCellNode | undefined;
    c?.remove();
  });
}

/* ── Toolbar state hook ─────────────────────────────────────────── */

type ToolbarState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  blockType: string;
  link: boolean;
  ordered: boolean;
  unordered: boolean;
  checklist: boolean;
  align: ElementFormatType | null;
  inCode: boolean;
  codeLanguage: string;
  inTable: boolean;
};

function useToolbarState(editor: ReturnType<typeof useLexicalComposerContext>[0]): ToolbarState {
  const compute = useCallback((): ToolbarState => {
    const s: ToolbarState = {
      bold: false, italic: false, underline: false, strikethrough: false, code: false,
      blockType: "paragraph", link: false, ordered: false, unordered: false, checklist: false,
      align: null, inCode: false, codeLanguage: "", inTable: false,
    };
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return s;

    s.bold = selection.hasFormat("bold");
    s.italic = selection.hasFormat("italic");
    s.underline = selection.hasFormat("underline");
    s.strikethrough = selection.hasFormat("strikethrough");
    s.code = selection.hasFormat("code");

    const anchor = selection.anchor.getNode();
    let element: ReturnType<typeof anchor.getParent> = $isElementNode(anchor) ? anchor : anchor.getParent();
    while (element && !$isRootNode(element)) {
      if ($isElementNode(element)) {
        const type = element.getType();
        if (type === "heading") {
          const tag = (element as unknown as { getTag(): string }).getTag();
          s.blockType = tag.startsWith("h") ? tag : "paragraph";
          break;
        }
        if (type === "quote") { s.blockType = "quote"; break; }
        if (type === "code") {
          s.inCode = true;
          s.blockType = "code";
          s.codeLanguage = (element as CodeNode).getLanguage() ?? "";
          break;
        }
        if (type === "list") {
          const listType = (element as unknown as { getListType(): string }).getListType();
          if (listType === "number") s.ordered = true;
          else s.unordered = true;
          s.blockType = "list";
          break;
        }
        if ($isCheckListNode(element)) { s.checklist = true; s.blockType = "checklist"; break; }
        if (type === "table") s.inTable = true;
        s.align = element.getFormatType() as ElementFormatType | null;
      }
      element = element.getParent();
    }

    const linkParent = $findMatchingParent(anchor, (n) => n.getType() === "link");
    s.link = !!linkParent;
    if ($getActiveTableCell()) s.inTable = true;
    return s;
  }, []);

  const [state, setState] = useState<ToolbarState>(compute);

  useEffect(() => {
    setState(compute());
    return editor.registerUpdateListener(() => setState(compute()));
  }, [editor, compute]);

  return state;
}

/* ── Toolbar ────────────────────────────────────────────────────── */

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Gray", value: "#64748b" },
  { label: "Red", value: "#dc2626" },
  { label: "Gold", value: "#b45309" },
  { label: "Azure", value: "#0369a1" },
  { label: "Green", value: "#16a34a" },
  { label: "Purple", value: "#9333ea" },
];

const HIGHLIGHTS = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbcfe8" },
];

const BLOCKS = [
  { value: "paragraph", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
];

const ALIGNS: { value: ElementFormatType; glyph: string; label: string }[] = [
  { value: "left", glyph: "⯇", label: "Left" },
  { value: "center", glyph: "◫", label: "Center" },
  { value: "right", glyph: "⯈", label: "Right" },
  { value: "justify", glyph: "⬒", label: "Justify" },
];

export function EditorToolbar({ onImageUpload }: { onImageUpload?: () => void }) {
  const [editor] = useLexicalComposerContext();
  const state = useToolbarState(editor);
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(true);
  const linkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!linkOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (linkRef.current && !linkRef.current.contains(e.target as Node)) setLinkOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [linkOpen]);

  const setBlock = (val: string) => {
    editor.update(() => {
      const sel = $getSelection();
      if (!sel) return;
      if (val === "paragraph") {
        $setBlocksType(sel, () => $createParagraphNode());
      } else {
        $setBlocksType(sel, () => $createHeadingNode(val.slice(1) as HeadingTagType));
      }
    });
  };

  const insertQuote = () => {
    editor.update(() => {
      const sel = $getSelection();
      if (sel) $setBlocksType(sel, () => $createQuoteNode());
    });
  };

  const insertCodeBlock = () => {
    editor.update(() => {
      const sel = $getSelection();
      if (sel) $setBlocksType(sel, () => $createCodeNode());
    });
  };

  const openLinkDialog = () => {
    let href = "";
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchor = selection.anchor.getNode();
      const link = $findMatchingParent(anchor, (n) => n.getType() === "link");
      href = (link as { getURL?(): string } | null)?.getURL?.() ?? "";
    }
    setLinkUrl(href);
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    editor.dispatchCommand(
      TOGGLE_LINK_COMMAND,
      url ? { url, rel: "noopener noreferrer nofollow", target: linkNewTab ? "_blank" : undefined } : null
    );
    setLinkOpen(false);
  };

  async function insertImages(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    for (const f of list) {
      const res = await uploadToStorage(f, "editor");
      if (!res.error) insertImageAtSelection(editor, res.url, f.name);
    }
  }

  const languageOptions = useMemo(() => {
    try {
      return getCodeLanguageOptions().map(([value, label]) => ({ value, label }));
    } catch {
      return [];
    }
  }, []);

  const alignLabel = ALIGNS.find((a) => a.value === state.align)?.label ?? "Left";

  return (
    <div className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="flex max-w-full items-center gap-0.5 overflow-x-auto p-1.5 [scrollbar-width:thin]">
        <TBtn label="Undo" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>↶</TBtn>
        <TBtn label="Redo" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>↷</TBtn>
        <TDivider />

        <select
          value={state.blockType}
          onChange={(e) => setBlock(e.target.value)}
          onMouseDown={(e) => e.preventDefault()}
          className="h-8 shrink-0 rounded-md border border-border bg-background px-2 text-sm font-medium focus:outline-none"
          aria-label="Block type"
        >
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
          <option value="quote">Quote</option>
          <option value="code">Code block</option>
          {state.checklist && <option value="checklist">Checklist</option>}
        </select>
        <TDivider />

        <TBtn label="Bold" active={state.bold} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}><strong>B</strong></TBtn>
        <TBtn label="Italic" active={state.italic} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}><em>I</em></TBtn>
        <TBtn label="Underline" active={state.underline} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}><u>U</u></TBtn>
        <TBtn label="Strikethrough" active={state.strikethrough} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}><s>S</s></TBtn>
        <TBtn label="Inline code" active={state.code} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}>&lt;/&gt;</TBtn>
        <TDivider />

        {/* Link */}
        <div ref={linkRef} className="relative shrink-0">
          <TBtn label="Link" active={state.link} onClick={openLinkDialog}>
            <AppIcon name="link" size={15} />
          </TBtn>
          {linkOpen && (
            <div className="absolute left-0 top-9 z-40 w-60 rounded-lg border bg-popover p-2 shadow-xl">
              <input
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyLink();
                  if (e.key === "Escape") setLinkOpen(false);
                }}
                placeholder="https://…"
                className="h-8 w-full rounded-md border bg-background px-2 text-sm focus:outline-none"
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={linkNewTab} onChange={(e) => setLinkNewTab(e.target.checked)} />
                Open in new tab
              </label>
              <div className="mt-2 flex items-center gap-1.5">
                <button type="button" onClick={applyLink} className="h-7 flex-1 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground">
                  {state.link ? "Update" : "Add"}
                </button>
                {state.link && (
                  <button
                    type="button"
                    onClick={() => { editor.dispatchCommand(TOGGLE_LINK_COMMAND, null); setLinkOpen(false); }}
                    className="h-7 rounded-md border px-2 text-xs font-medium text-muted-foreground"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <TDivider />

        {/* Text color */}
        <Dropdown trigger={<span className="text-xs">A</span>} align="left">
          {(close) => (
            <div className="grid grid-cols-2 gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  title={c.label}
                  onClick={() => {
                    editor.update(() => {
                      const sel = $getSelection();
                      if (!$isRangeSelection(sel)) return;
                      sel.getNodes().forEach((n) => {
                        if ($isTextNode(n)) {
                          const cur = n.getStyle().replace(/color:[^;]+;/g, "");
                          n.setStyle(c.value ? `color: ${c.value};` + cur : cur);
                        }
                      });
                    });
                    close();
                  }}
                  className="flex h-8 items-center justify-center gap-1 rounded-md border px-2 text-xs hover:border-primary"
                >
                  <span className="inline-block h-4 w-4 rounded-full border" style={{ background: c.value || "transparent" }} />
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </Dropdown>

        {/* Highlight */}
        <Dropdown trigger={<span className="rounded bg-yellow-300 px-1.5 text-[10px] font-bold text-black">HL</span>} align="left">
          {(close) => (
            <div className="grid grid-cols-2 gap-1.5">
              {HIGHLIGHTS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    editor.update(() => {
                      const sel = $getSelection();
                      if (!$isRangeSelection(sel)) return;
                      sel.getNodes().forEach((n) => {
                        if ($isTextNode(n)) {
                          const cur = n.getStyle().replace(/background-color:[^;]+;/g, "");
                          n.setStyle(c.value ? `background-color: ${c.value};` + cur : cur);
                        }
                      });
                    });
                    close();
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-md border px-2 text-left text-xs hover:border-primary"
                >
                  <span className="inline-block h-4 w-4 rounded border" style={{ background: c.value || "transparent" }} />
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </Dropdown>
        <TDivider />

        <TBtn label="Bulleted list" active={state.unordered} onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>•≡</TBtn>
        <TBtn label="Numbered list" active={state.ordered} onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>1≡</TBtn>
        <TBtn label="Checklist" active={state.checklist} onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)}>☑</TBtn>
        <TDivider />

        <Dropdown trigger={<span className="text-[11px]">{alignLabel}</span>} align="left">
          {(close) => (
            <div className="space-y-0.5">
              {ALIGNS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => { editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, a.value); close(); }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs capitalize hover:bg-accent",
                    state.align === a.value && "bg-accent"
                  )}
                >
                  {a.glyph} {a.label}
                </button>
              ))}
            </div>
          )}
        </Dropdown>
        <TDivider />

        <Dropdown trigger={<span className="text-sm font-semibold">+ Insert</span>} align="right">
          {(close) => (
            <div className="space-y-0.5">
              <button type="button" onClick={() => { if (onImageUpload) onImageUpload(); else fileRef.current?.click(); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent">
                <AppIcon name="image" size={14} /> Image
              </button>
              <button type="button" onClick={() => { const url = window.prompt("YouTube video URL or ID"); const id = getYouTubeId(url ?? ""); if (id) insertYouTubeAtSelection(editor, id); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent">
                <AppIcon name="video" size={14} /> YouTube
              </button>
              <button type="button" onClick={() => { editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: "3", rows: "3", includeHeaders: true }); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent">
                <AppIcon name="table" size={14} /> Table (3×3)
              </button>
              <button type="button" onClick={() => { editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent">
                — Divider
              </button>
            </div>
          )}
        </Dropdown>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { void insertImages(e.target.files); e.target.value = ""; }}
        />
        <TDivider />

        <TBtn label="Blockquote" active={state.blockType === "quote"} onClick={insertQuote}>❝</TBtn>
        <TBtn label="Code block" active={state.inCode} onClick={insertCodeBlock}>&lt;/&gt;</TBtn>
      </div>

      {/* Contextual row: code language */}
      {state.inCode && (
        <div className="flex items-center gap-2 overflow-x-auto border-t bg-muted/40 px-2 py-1">
          <span className="shrink-0 text-[11px] text-muted-foreground">Language</span>
          <select
            value={state.codeLanguage}
            onChange={(e) =>
              editor.update(() => {
                const sel = $getSelection();
                if (!$isRangeSelection(sel)) return;
                const code = $findMatchingParent(sel.anchor.getNode(), $isCodeNode);
                if (code) code.setLanguage(e.target.value);
              })
            }
            className="h-7 rounded-md border bg-background px-2 text-xs focus:outline-none"
          >
            {languageOptions.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Contextual row: table controls */}
      {state.inTable && (
        <div className="flex flex-wrap items-center gap-1.5 border-t bg-muted/40 px-2 py-1">
          <span className="text-[11px] text-muted-foreground">Table</span>
          <button type="button" onClick={() => editor.update(() => $addRow(false))} className="h-7 rounded-md border bg-background px-2 text-xs hover:bg-accent">+ row</button>
          <button type="button" onClick={() => editor.update(() => $deleteRow())} className="h-7 rounded-md border bg-background px-2 text-xs hover:bg-accent">del row</button>
          <button type="button" onClick={() => editor.update(() => $addColumn(false))} className="h-7 rounded-md border bg-background px-2 text-xs hover:bg-accent">+ col</button>
          <button type="button" onClick={() => editor.update(() => $deleteColumn())} className="h-7 rounded-md border bg-background px-2 text-xs hover:bg-accent">del col</button>
        </div>
      )}
    </div>
  );
}
