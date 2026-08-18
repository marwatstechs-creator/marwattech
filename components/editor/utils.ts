"use client";

import type { LexicalEditor } from "lexical";
import { $createParagraphNode, $getRoot, $getSelection, $isNodeSelection, $isRangeSelection } from "lexical";
import { $createImageNode, ImageNode, type ImageAlign } from "./nodes/ImageNode";
import { $createYouTubeNode } from "./nodes/YouTubeNode";
import { createClient } from "@/lib/supabase/client";

/** True if a stored value looks like a Lexical JSON editor state. */
export function isJsonContent(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return false;
  const t = value.trim();
  if (!t.startsWith("{") && !t.startsWith("[")) return false;
  try {
    const parsed = JSON.parse(t);
    return !!parsed && typeof parsed === "object" && "root" in parsed;
  } catch {
    return false;
  }
}

/** Serialize an editor to a JSON string (empty-safe). */
export function serializeEditor(editor: LexicalEditor): string {
  const state = editor.getEditorState();
  const json = state.toJSON();
  // Normalize: always include a root, drop empty children noise.
  const root = json.root as { children?: unknown[] } | undefined;
  if (!root || !Array.isArray(root.children)) {
    return JSON.stringify({ root: { children: [], direction: null, format: "", indent: 0, type: "root", version: 1 } });
  }
  return JSON.stringify(json);
}

/** Insert an image node at the current selection (or as a block). */
export function insertImageAtSelection(
  editor: LexicalEditor,
  src: string,
  altText = "",
  width: number | null = null
) {
  editor.update(() => {
    const selection = $getSelection();
    const imageNode = $createImageNode(src, altText, width, "", "center");
    const p = $createParagraphNode();
    p.append(imageNode);
    if ($isNodeSelection(selection)) {
      selection.getNodes().forEach((n) => n.remove());
      const root = $getRoot();
      root.append(p);
      p.selectEnd();
      return;
    }
    if ($isRangeSelection(selection)) {
      const anchor = selection.anchor.getNode();
      const block = anchor.getTopLevelElement() ?? anchor;
      block.insertAfter(p);
      p.selectEnd();
      return;
    }
    const root = $getRoot();
    root.append(p);
    p.selectEnd();
  });
}

/** Insert a YouTube embed at the current selection. */
export function insertYouTubeAtSelection(editor: LexicalEditor, videoId: string) {
  editor.update(() => {
    const selection = $getSelection();
    const node = $createYouTubeNode(videoId);
    const p = $createParagraphNode();
    p.append(node);
    if ($isRangeSelection(selection)) {
      const anchor = selection.anchor.getNode();
      const block = anchor.getTopLevelElement() ?? anchor;
      block.insertAfter(p);
    } else {
      const root = $getRoot();
      root.append(p);
    }
    p.selectEnd();
  });
}

/** Extract a YouTube video ID from a URL or plain ID. */
export function getYouTubeId(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  const short = t.match(/youtu\.be\/([\w-]{6,})/);
  if (short) return short[1];
  const watch = t.match(/[?&]v=([\w-]{6,})/);
  if (watch) return watch[1];
  const embed = t.match(/youtube\.com\/embed\/([\w-]{6,})/);
  if (embed) return embed[1];
  if (/^[\w-]{6,}$/.test(t)) return t;
  return null;
}

/** Upload a file to the existing Supabase `media` bucket and return the public URL. */
export async function uploadToStorage(
  file: File,
  folder = "editor"
): Promise<{ url: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { url: "", error: "Please choose an image file." };
  }
  try {
    const db = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${folder}/${Date.now()}-${safeName}`;
    const { error } = await db.storage
      .from("media")
      .upload(path, file, { upsert: false, cacheControl: "3600" });
    if (error) throw error;
    const { data } = db.storage.from("media").getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (err) {
    console.error(err);
    return { url: "", error: "Upload failed — check the storage bucket exists and you have permission." };
  }
}

export { ImageNode, $createImageNode };
export type { ImageAlign };
