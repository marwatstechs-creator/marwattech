"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";

function ToolbarBtn({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose-cms min-h-[220px] max-w-none px-4 py-3 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="min-h-[280px] rounded-md border" />;
  }

  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1.5">
        <ToolbarBtn
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </ToolbarBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarBtn
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarBtn
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <AppIcon name="grid" size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <AppIcon name="table" size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <AppIcon name="quote" size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          {"</>"}
        </ToolbarBtn>
        <span className="ml-auto flex gap-0.5">
          <ToolbarBtn
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
          >
            <AppIcon name="arrowLeft" size={15} />
          </ToolbarBtn>
          <ToolbarBtn
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
          >
            <AppIcon name="arrowRight" size={15} />
          </ToolbarBtn>
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
