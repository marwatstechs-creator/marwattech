"use client";

import * as React from "react";
import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";

export type SerializedYouTubeNode = Spread<
  { videoID: string; type: "youtube"; version: 1 },
  SerializedLexicalNode
>;

const WIDTH = 640;
const HEIGHT = 360;

export class YouTubeNode extends DecoratorNode<React.ReactElement> {
  __id: string;

  static getType(): string {
    return "youtube";
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__id, node.__key);
  }

  constructor(id: string, key?: NodeKey) {
    super(key);
    this.__id = id;
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return $createYouTubeNode(serializedNode.videoID);
  }

  exportJSON(): SerializedYouTubeNode {
    return { videoID: this.__id, type: "youtube", version: 1 };
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
      iframe: (node: HTMLElement) => {
        const el = node as HTMLIFrameElement;
        const src = el.getAttribute("src") ?? "";
        const m = src.match(/embed\/([\w-]{6,})/);
        if (!m) return null;
        return { conversion: () => ({ node: $createYouTubeNode(m[1]) }), priority: 0 };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", `https://www.youtube.com/embed/${this.__id}`);
    iframe.setAttribute("width", String(WIDTH));
    iframe.setAttribute("height", String(HEIGHT));
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("title", "YouTube video player");
    return { element: iframe };
  }

  decorate(): React.ReactElement {
    return (
      <span className="editor-embed-wrap my-3 block overflow-hidden rounded-xl border border-border bg-muted/40 p-2">
        <span className="relative block aspect-video w-full overflow-hidden rounded-lg">
          <iframe
            src={`https://www.youtube.com/embed/${this.__id}`}
            title="YouTube video player"
            className="absolute inset-0 h-full w-full"
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </span>
      </span>
    );
  }
}

export function $createYouTubeNode(videoID: string): YouTubeNode {
  return $applyNodeReplacement(new YouTubeNode(videoID));
}

export function $isYouTubeNode(node: LexicalNode | null | undefined): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
