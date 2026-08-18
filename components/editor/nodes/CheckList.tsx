"use client";

import * as React from "react";
import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  DecoratorNode,
  ElementNode,
} from "lexical";
import { cn } from "@/lib/utils";

/* ── CheckListNode ─────────────────────────────────────────────── */

export type SerializedCheckListNode = Spread<
  { type: "checklist"; version: 1 },
  SerializedElementNode
>;

export class CheckListNode extends ElementNode {
  static getType(): string {
    return "checklist";
  }

  static clone(node: CheckListNode): CheckListNode {
    return new CheckListNode(node.__key);
  }

  createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
    const ul = document.createElement("ul");
    ul.className = "editor-checklist my-3 space-y-1.5";
    ul.setAttribute("role", "list");
    return ul;
  }

  updateDOM(prevNode: CheckListNode, dom: HTMLElement): boolean {
    return prevNode.__format !== this.__format;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      ul: (node: HTMLElement) => {
        if (node.getAttribute("data-lexical-checklist") !== "true") return null;
        return { conversion: () => ({ node: $createCheckListNode() }), priority: 1 };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("ul");
    element.setAttribute("data-lexical-checklist", "true");
    return { element };
  }

  static importJSON(_serializedNode: SerializedCheckListNode): CheckListNode {
    return $createCheckListNode();
  }

  exportJSON(): SerializedCheckListNode {
    return { ...super.exportJSON(), type: "checklist", version: 1 };
  }
}

export function $createCheckListNode(): CheckListNode {
  return $applyNodeReplacement(new CheckListNode());
}

export function $isCheckListNode(node: LexicalNode | null | undefined): node is CheckListNode {
  return node instanceof CheckListNode;
}

/* ── CheckListItemNode ─────────────────────────────────────────── */

export type SerializedCheckListItemNode = Spread<
  { checked: boolean; text: string; type: "checklist-item"; version: 1 },
  SerializedLexicalNode
>;

export class CheckListItemNode extends DecoratorNode<React.ReactElement> {
  __checked: boolean;
  __text: string;

  static getType(): string {
    return "checklist-item";
  }

  static clone(node: CheckListItemNode): CheckListItemNode {
    return new CheckListItemNode(node.__checked, node.__text, node.__key);
  }

  constructor(checked: boolean, text: string, key?: NodeKey) {
    super(key);
    this.__checked = checked;
    this.__text = text;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const li = document.createElement("li");
    li.className = "editor-checklist-item";
    li.setAttribute("role", "listitem");
    return li;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedCheckListItemNode): CheckListItemNode {
    return $createCheckListItemNode(serializedNode.checked, serializedNode.text);
  }

  exportJSON(): SerializedCheckListItemNode {
    return {
      checked: this.__checked,
      text: this.__text,
      type: "checklist-item",
      version: 1,
    };
  }

  getChecked(): boolean {
    return this.__checked;
  }
  getText(): string {
    return this.__text;
  }
  setChecked(checked: boolean): void {
    const writable = this.getWritable();
    writable.__checked = checked;
  }
  setText(text: string): void {
    const writable = this.getWritable();
    writable.__text = text;
  }

  decorate(editor: LexicalEditor): React.ReactElement {
    return <ChecklistItemComponent editor={editor} node={this} />;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createCheckListItemNode(checked = false, text = ""): CheckListItemNode {
  return $applyNodeReplacement(new CheckListItemNode(checked, text));
}

export function $isCheckListItemNode(node: LexicalNode | null | undefined): node is CheckListItemNode {
  return node instanceof CheckListItemNode;
}

/* ── Item component (checkbox + editable text) ─────────────────── */

function focusDecorator(editor: LexicalEditor, nodeKey: NodeKey) {
  setTimeout(() => {
    const el = editor.getElementByKey(nodeKey);
    const editable = el?.querySelector('[contenteditable="true"]') as HTMLElement | null;
    editable?.focus();
  }, 0);
}

function ChecklistItemComponent({ node, editor }: { node: CheckListItemNode; editor: LexicalEditor }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [checked, setChecked] = React.useState(node.getChecked());

  React.useEffect(() => {
    const el = ref.current;
    if (el && el.innerText !== node.getText()) {
      el.innerText = node.getText();
    }
  }, [node, checked]);

  function commitText(text: string) {
    editor.update(() => {
      const n = $getNodeByKey(node.getKey());
      if (n instanceof CheckListItemNode) n.setText(text);
    });
  }

  function toggle() {
    setChecked((v) => {
      const next = !v;
      editor.update(() => {
        const n = $getNodeByKey(node.getKey());
        if (n instanceof CheckListItemNode) n.setChecked(next);
      });
      return next;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      if (e.key === "Enter") {
      e.preventDefault();
      editor.update(() => {
        const n = $getNodeByKey(node.getKey());
        if (!n || !(n instanceof CheckListItemNode)) return;
        const item = $createCheckListItemNode(false, "");
        n.insertAfter(item);
        const sel = $getSelection();
        if ($isRangeSelection(sel)) {
          sel.insertText("");
        }
        focusDecorator(editor, item.getKey());
      });
    } else if (e.key === "Backspace" && !ref.current?.innerText) {
      e.preventDefault();
      editor.update(() => {
        const n = $getNodeByKey(node.getKey());
        if (!n || !(n instanceof CheckListItemNode)) return;
        const parent = n.getParent();
        const prev = n.getPreviousSibling();
        n.remove();
        if (prev instanceof CheckListItemNode) {
          focusDecorator(editor, prev.getKey());
        } else if (parent) {
          const p = $createParagraphNode();
          parent.insertAfter(p);
          p.select();
        }
      });
    }
  }

  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={toggle}
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"
        )}
      >
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </button>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        className={cn(
          "min-h-[1.25rem] flex-1 outline-none",
          checked ? "text-muted-foreground line-through" : "text-foreground"
        )}
        onInput={(e) => commitText((e.target as HTMLDivElement).innerText)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
