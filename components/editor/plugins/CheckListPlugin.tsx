"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootNode,
  COMMAND_PRIORITY_LOW,
  createCommand,
  type LexicalCommand,
} from "lexical";
import {
  $createCheckListItemNode,
  $createCheckListNode,
  $isCheckListNode,
} from "../nodes/CheckList";

export const INSERT_CHECK_LIST_COMMAND: LexicalCommand<undefined> = createCommand(
  "INSERT_CHECK_LIST_COMMAND"
);

export default function CheckListPlugin(): React.ReactElement | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_CHECK_LIST_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          const anchor = selection.anchor.getNode();
          const block = $findMatchingParent(anchor, (e) => $isElementNode(e) && !!e.getParent() && $isRootNode(e.getParent()));

          if (block && $isElementNode(block)) {
            const list = $createCheckListNode();
            const item = $createCheckListItemNode(false, "");
            list.append(item);
            const p = $createParagraphNode();
            block.replace(list);
            list.insertAfter(p);
            // focus the new item after mount
            setTimeout(() => {
              const el = editor.getElementByKey(item.getKey());
              (el?.querySelector('[contenteditable="true"]') as HTMLElement | null)?.focus();
            }, 0);
          } else {
            const list = $createCheckListNode();
            list.append($createCheckListItemNode(false, ""));
            const p = $createParagraphNode();
            const root = anchor.getTopLevelElementOrThrow();
            root.insertAfter(list);
            list.insertAfter(p);
            list.selectStart();
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}

export { $isCheckListNode };
