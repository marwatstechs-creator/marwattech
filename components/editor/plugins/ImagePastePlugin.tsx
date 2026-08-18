"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_NORMAL, PASTE_COMMAND } from "lexical";
import { insertImageAtSelection, uploadToStorage } from "../utils";

function getImages(data: DataTransfer | null): File[] {
  if (!data) return [];
  return Array.from(data.files).filter((f) => f.type.startsWith("image/"));
}

async function insertImages(editor: ReturnType<typeof useLexicalComposerContext>[0], files: File[]) {
  for (const f of files) {
    const res = await uploadToStorage(f, "editor");
    if (!res.error) insertImageAtSelection(editor, res.url, f.name);
  }
}

/** Handles pasted / dragged-in images and uploads them to Supabase. */
export default function ImagePastePlugin(): React.ReactElement | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Paste
    const removePaste = editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const images = getImages((event as ClipboardEvent).clipboardData);
        if (images.length) {
          event.preventDefault();
          void insertImages(editor, images);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_NORMAL
    );

    // Drag & drop
    const root = editor.getRootElement();
    const onDragOver = (e: DragEvent) => {
      if (getImages(e.dataTransfer).length) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      const images = getImages(e.dataTransfer);
      if (images.length) {
        e.preventDefault();
        void insertImages(editor, images);
      }
    };
    root?.addEventListener("dragover", onDragOver);
    root?.addEventListener("drop", onDrop);

    return () => {
      removePaste();
      root?.removeEventListener("dragover", onDragOver);
      root?.removeEventListener("drop", onDrop);
    };
  }, [editor]);

  return null;
}
