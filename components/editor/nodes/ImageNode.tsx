"use client";

import * as React from "react";
import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { $applyNodeReplacement, $getNodeByKey, DecoratorNode } from "lexical";
import { toast } from "sonner";
import { AppIcon } from "@/components/app-icon";
import { uploadToStorage } from "@/components/editor/utils";

export type ImageAlign = "left" | "center" | "right";

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width: number | null;
    caption: string;
    align: ImageAlign;
    type: "image";
    version: 1;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;
  __width: number | null;
  __caption: string;
  __align: ImageAlign;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__caption,
      node.__align,
      node.__key
    );
  }

  constructor(
    src: string,
    altText = "",
    width: number | null = null,
    caption = "",
    align: ImageAlign = "center",
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__caption = caption;
    this.__align = align;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.className = "editor-block";
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: HTMLElement) => {
        const el = node as HTMLImageElement;
        return {
          conversion: () => ({
            node: $createImageNode(el.src, el.alt, null, "", "center"),
          }),
          priority: 0,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    if (this.__width) element.setAttribute("width", String(this.__width));
    return { element };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(
      serializedNode.src,
      serializedNode.altText,
      serializedNode.width ?? null,
      serializedNode.caption ?? "",
      serializedNode.align ?? "center"
    );
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      caption: this.__caption,
      align: this.__align,
      type: "image",
      version: 1,
    };
  }

  decorate(editor: LexicalEditor): React.ReactElement {
    return <ImageComponent node={this} editor={editor} />;
  }

  getSrc(): string {
    return this.__src;
  }
  getAltText(): string {
    return this.__altText;
  }
  getWidth(): number | null {
    return this.__width;
  }
  getCaption(): string {
    return this.__caption;
  }
  getAlign(): ImageAlign {
    return this.__align;
  }
  setSrc(src: string): void {
    this.getWritable().__src = src;
  }
  setAltText(altText: string): void {
    this.getWritable().__altText = altText;
  }
  setCaption(caption: string): void {
    this.getWritable().__caption = caption;
  }
  setWidth(width: number | null): void {
    this.getWritable().__width = width;
  }
  setAlign(align: ImageAlign): void {
    this.getWritable().__align = align;
  }
}

export function $createImageNode(
  src: string,
  altText = "",
  width: number | null = null,
  caption = "",
  align: ImageAlign = "center"
): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText, width, caption, align));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

function ImageComponent({ node, editor }: { node: ImageNode; editor: LexicalEditor }) {
  const [editing, setEditing] = React.useState(false);
  const [alt, setAlt] = React.useState(node.getAltText());
  const [cap, setCap] = React.useState(node.getCaption());
  const [w, setW] = React.useState<number | null>(node.getWidth());
  const [alignVal, setAlignVal] = React.useState<ImageAlign>(node.getAlign());
  const [src, setSrc] = React.useState(node.getSrc());
  const [replacing, setReplacing] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Push local edits back into the node so serialization picks them up.
  const syncNode = React.useCallback(
    (patch: {
      src?: string;
      altText?: string;
      caption?: string;
      width?: number | null;
      align?: ImageAlign;
    }) => {
      editor.update(() => {
        const n = $getNodeByKey(node.getKey());
        if (!n || !(n instanceof ImageNode)) return;
        if (patch.src !== undefined) n.setSrc(patch.src);
        if (patch.altText !== undefined) n.setAltText(patch.altText);
        if (patch.caption !== undefined) n.setCaption(patch.caption);
        if (patch.width !== undefined) n.setWidth(patch.width);
        if (patch.align !== undefined) n.setAlign(patch.align);
      });
    },
    [editor, node]
  );

  React.useEffect(() => {
    syncNode({ src, altText: alt, caption: cap, width: w, align: alignVal });
  }, [src, alt, cap, w, alignVal, syncNode]);

  async function replaceFile(file: File) {
    setReplacing(true);
    const res = await uploadToStorage(file, "editor");
    setReplacing(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setSrc(res.url);
    toast.success("Image replaced");
  }

  return (
    <span
      className="editor-image-wrap block"
      style={{
        textAlign: alignVal === "center" ? "center" : alignVal === "right" ? "right" : "left",
      }}
    >
      <span className="group relative inline-block max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-w-full rounded-lg border border-border object-contain"
          style={{ width: w ? `${w}px` : undefined, maxWidth: "100%" }}
        />
        <span className="absolute right-1 top-1 hidden gap-1 rounded-md bg-background/90 p-1 shadow group-hover:flex">
          <button
            type="button"
            title="Replace image"
            className="grid h-7 w-7 place-items-center rounded text-foreground/80 hover:bg-accent"
            onClick={() => fileRef.current?.click()}
          >
            <AppIcon name="upload" size={14} />
          </button>
          <button
            type="button"
            title="Edit details"
            className="grid h-7 w-7 place-items-center rounded text-foreground/80 hover:bg-accent"
            onClick={() => setEditing((v) => !v)}
          >
            <AppIcon name="pencil" size={14} />
          </button>
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) replaceFile(f);
            e.target.value = "";
          }}
        />
        {editing && (
          <span className="mt-2 flex flex-col gap-2 rounded-lg border bg-card p-2 text-left text-xs">
            <label className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-muted-foreground">Alt text</span>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className="h-7 flex-1 rounded border bg-background px-2"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-muted-foreground">Width (px)</span>
              <input
                type="number"
                min={80}
                value={w ?? ""}
                placeholder="Auto"
                onChange={(e) => setW(e.target.value ? Number(e.target.value) : null)}
                className="h-7 flex-1 rounded border bg-background px-2"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-muted-foreground">Align</span>
              <select
                value={alignVal}
                onChange={(e) => setAlignVal(e.target.value as ImageAlign)}
                className="h-7 flex-1 rounded border bg-background px-2"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-muted-foreground">Caption</span>
              <input
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                className="h-7 flex-1 rounded border bg-background px-2"
              />
            </label>
          </span>
        )}
      </span>
      {cap && <span className="mt-1 block text-xs text-muted-foreground">{cap}</span>}
      {replacing && <span className="sr-only">Uploading…</span>}
    </span>
  );
}
