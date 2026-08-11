"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import Youtube from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

const TEXT_COLORS = [
  { label: "Default", value: "#1f2937" },
  { label: "Red", value: "#dc2626" },
  { label: "Gold", value: "#b45309" },
  { label: "Azure", value: "#0369a1" },
  { label: "Green", value: "#16a34a" },
  { label: "Purple", value: "#9333ea" },
  { label: "Gray", value: "#64748b" },
  { label: "White", value: "#ffffff" },
];

const HIGHLIGHTS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Red", value: "#fecaca" },
];

/* ── Small toolbar primitives ─────────────────────────────────────────── */

function ToolbarBtn({
  onClick,
  active,
  disabled,
  label,
  children,
  className,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-foreground/80 hover:bg-accent-hover hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

/* ── Color menu (reusable dropdown) ───────────────────────────────────── */

function ColorMenu({
  open,
  onToggle,
  onSelect,
  onClear,
  activeColor,
  swatches,
  clearLabel,
}: {
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  onClear: () => void;
  activeColor?: string | null;
  swatches: { label: string; value: string }[];
  clearLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onToggle();
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative">
      <ToolbarBtn label={clearLabel} onClick={onToggle} active={open} className="px-2">
        <span
          className="flex h-4 w-4 items-center justify-center rounded-full border border-border"
          style={{ backgroundColor: activeColor ?? "transparent" }}
        >
          <span className="text-[9px] leading-none">A</span>
        </span>
      </ToolbarBtn>
      {open && (
        <div
          className="absolute left-0 top-9 z-50 flex w-44 flex-wrap gap-1.5 rounded-lg border bg-popover p-2 shadow-xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          {swatches.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              aria-label={`${clearLabel}: ${c.label}`}
              onClick={() => onSelect(c.value)}
              className={cn(
                "h-6 w-6 rounded-md border border-border transition-transform hover:scale-110",
                activeColor === c.value && "ring-2 ring-primary ring-offset-1"
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
          <button
            type="button"
            onClick={onClear}
            className="mt-1 w-full rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground/70 hover:bg-accent-hover"
          >
            {clearLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── The editor ───────────────────────────────────────────────────────── */

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing…",
  minHeight = 280,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const [heading, setHeading] = useState("paragraph");
  const [menu, setMenu] = useState<"none" | "image" | "table" | "color" | "highlight">("none");
  const [imgUrl, setImgUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, link: false, underline: false }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      CharacterCount,
      Youtube.configure({ nocookie: true, controls: true, width: 640, height: 360 }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      const h = editor.getAttributes("heading").level;
      setHeading(h ? `h${h}` : "paragraph");
    },
    onSelectionUpdate: ({ editor }) => {
      const h = editor.getAttributes("heading").level;
      setHeading(h ? `h${h}` : "paragraph");
    },
    editorProps: {
      attributes: {
        class: "tiptap prose-cms max-w-none px-4 py-3 focus:outline-none",
      },
    },
  });

  // Keep in sync when the form resets / loads a different record.
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="min-h-[280px] rounded-md border" />;
  }

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    try {
      const db = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `uploads/${Date.now()}-${safeName}`;
      const { error } = await db.storage
        .from("media")
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (error) throw error;
      const { data } = db.storage.from("media").getPublicUrl(path);
      editor.chain().focus().setImage({ src: data.publicUrl, alt: file.name }).run();
      toast.success("Image added");
      setImgUrl("");
      setMenu("none");
    } catch (err) {
      toast.error("Upload failed — check that the storage bucket exists and you have permission.");
      console.error(err);
    }
  };

  const insertLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (https://…)", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const insertYoutube = () => {
    const url = window.prompt("YouTube video URL or ID", "https://www.youtube.com/watch?v=");
    if (!url?.trim()) return;
    editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
    setMenu("none");
  };

  const setBlock = (val: string) => {
    if (val === "paragraph") editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: Number(val.slice(1)) as 1 | 2 | 3 | 4 }).run();
    setHeading(val);
  };

  const isInTable = editor.isActive("table");
  const words = editor.storage.characterCount?.words?.() ?? 0;
  const chars = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1.5">
        {/* Block type */}
        <select
          value={heading}
          onChange={(e) => setBlock(e.target.value)}
          onMouseDown={(e) => e.preventDefault()}
          className="h-8 rounded-md border border-border bg-background px-2 text-sm font-medium focus:outline-none"
          aria-label="Block type"
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
        <Divider />

        {/* Inline text */}
        <ToolbarBtn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <u>U</u>
        </ToolbarBtn>
        <ToolbarBtn label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <s>S</s>
        </ToolbarBtn>
        <ToolbarBtn label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          {"<>"}
        </ToolbarBtn>
        <ColorMenu
          open={menu === "color"}
          onToggle={() => setMenu(menu === "color" ? "none" : "color")}
          onSelect={(v) => editor.chain().focus().setColor(v).run()}
          onClear={() => editor.chain().focus().unsetColor().run()}
          activeColor={editor.getAttributes("textStyle").color as string | undefined}
          swatches={TEXT_COLORS}
          clearLabel="Default color"
        />
        <ColorMenu
          open={menu === "highlight"}
          onToggle={() => setMenu(menu === "highlight" ? "none" : "highlight")}
          onSelect={(v) => editor.chain().focus().toggleHighlight({ color: v }).run()}
          onClear={() => editor.chain().focus().unsetHighlight().run()}
          activeColor={editor.getAttributes("highlight").color as string | undefined}
          swatches={HIGHLIGHTS}
          clearLabel="Remove highlight"
        />
        <Divider />

        {/* Alignment */}
        <ToolbarBtn label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <span className="text-[13px] leading-none">≡</span>
        </ToolbarBtn>
        <ToolbarBtn label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <span className="text-[13px] leading-none">☰</span>
        </ToolbarBtn>
        <ToolbarBtn label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <span className="text-[13px] leading-none">≡→</span>
        </ToolbarBtn>
        <ToolbarBtn label="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <span className="text-[13px] leading-none">☷</span>
        </ToolbarBtn>
        <Divider />

        {/* Lists & blocks */}
        <ToolbarBtn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <AppIcon name="grid" size={15} />
        </ToolbarBtn>
        <ToolbarBtn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <span className="text-[13px] font-bold leading-none">1.</span>
        </ToolbarBtn>
        <ToolbarBtn label="Task list" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <span className="text-[13px] leading-none">☑</span>
        </ToolbarBtn>
        <ToolbarBtn label="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <AppIcon name="quote" size={15} />
        </ToolbarBtn>
        <ToolbarBtn label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <AppIcon name="terminal" size={15} />
        </ToolbarBtn>
        <ToolbarBtn label="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <span className="text-[13px] leading-none">—</span>
        </ToolbarBtn>
        <Divider />

        {/* Media */}
        <ToolbarBtn label="Link" active={editor.isActive("link")} onClick={insertLink}>
          <AppIcon name="link" size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Image"
          active={menu === "image"}
          onClick={() => {
            setMenu(menu === "image" ? "none" : "image");
            setImgUrl("");
          }}
        >
          <AppIcon name="image" size={15} />
        </ToolbarBtn>
        <ToolbarBtn label="YouTube embed" onClick={insertYoutube}>
          <AppIcon name="youtube" size={15} />
        </ToolbarBtn>

        {/* Table */}
        <div className="relative">
          <ToolbarBtn
            label="Table"
            active={menu === "table" || isInTable}
            onClick={() => setMenu(menu === "table" ? "none" : "table")}
          >
            <AppIcon name="table" size={15} />
          </ToolbarBtn>
          {menu === "table" && (
            <div
              className="absolute left-0 top-9 z-50 flex w-44 flex-col gap-1 rounded-lg border bg-popover p-2 shadow-xl"
              onMouseDown={(e) => e.preventDefault()}
            >
              <button type="button" onClick={insertTable} className="rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-accent-hover">
                Insert 3×3 table
              </button>
              {isInTable && (
                <>
                  <div className="my-0.5 h-px bg-border" />
                  <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent-hover">
                    Add row below
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent-hover">
                    Add column right
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent-hover">
                    Delete row
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent-hover">
                    Delete column
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().mergeOrSplit().run()} className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent-hover">
                    Merge / split cells
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().toggleHeaderRow().run()} className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent-hover">
                    Toggle header row
                  </button>
                  <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="rounded-md px-2 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10">
                    Delete table
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <Divider />

        {/* History */}
        <ToolbarBtn label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <AppIcon name="arrowLeft" size={15} />
        </ToolbarBtn>
        <ToolbarBtn label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <AppIcon name="arrowRight" size={15} />
        </ToolbarBtn>
        <ToolbarBtn label="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <AppIcon name="refresh" size={15} />
        </ToolbarBtn>
      </div>

      {/* ── Image insert panel ──────────────────────────────────────── */}
      {menu === "image" && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 p-2" onMouseDown={(e) => e.preventDefault()}>
          <Input
            value={imgUrl}
            onChange={(e) => setImgUrl(e.target.value)}
            placeholder="https://… image URL"
            className="h-8 flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && imgUrl.trim()) {
                editor.chain().focus().setImage({ src: imgUrl.trim() }).run();
                setImgUrl("");
                setMenu("none");
              }
            }}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage(f);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()}>
            <AppIcon name="upload" size={14} />
            Upload
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8"
            disabled={!imgUrl.trim()}
            onClick={() => {
              editor.chain().focus().setImage({ src: imgUrl.trim() }).run();
              setImgUrl("");
              setMenu("none");
            }}
          >
            Insert
          </Button>
        </div>
      )}

      {/* ── Editor surface ──────────────────────────────────────────── */}
      <EditorContent editor={editor} style={{ minHeight }} />

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-t bg-muted/40 px-3 py-1.5 text-[11px] text-foreground/50">
        <span className="truncate">
          {editor.isActive("link")
            ? `🔗 ${editor.getAttributes("link").href}`
            : isInTable
              ? "Editing a table — use the Table menu to modify it."
              : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-3 tabular-nums">
          <span title="Words">{words} words</span>
          <span title="Characters">{chars} chars</span>
        </span>
      </div>
    </div>
  );
}
