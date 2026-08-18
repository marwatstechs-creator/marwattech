"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  sendAiMessage,
  clearAiHistory,
  generateBlogDraft,
  type ChatMessage,
} from "@/lib/actions/admin/ai";

export type AiHistoryItem = { role: "user" | "assistant"; content: string; createdAt: string };

export type AiContextData = {
  counts: Record<string, number>;
  recent: string[];
  syncs: { total: number; at: string | null }[];
  generatedAt: string;
};

/* ── Tiny safe markdown renderer (no dangerouslySetInnerHTML) ── */
function renderMd(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listBuf: string[] = [];

  const flushList = (key: string) => {
    if (!listBuf.length) return;
    out.push(
      <ul key={key} className="my-2 list-disc space-y-1 pl-5">
        {listBuf.map((li, i) => (
          <li key={i}>{inlineMd(li)}</li>
        ))}
      </ul>
    );
    listBuf = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith("```")) {
      if (inCode) {
        out.push(
          <pre key={`c${i}`} className="my-2 overflow-x-auto rounded-lg border bg-muted p-3 text-xs">
            <code>{codeBuf.join("\n")}</code>
          </pre>
        );
        codeBuf = [];
        inCode = false;
      } else {
        flushList(`l${i}`);
        inCode = true;
      }
      return;
    }
    if (inCode) {
      codeBuf.push(line);
      return;
    }
    if (/^\s*[-*] /.test(line)) {
      listBuf.push(line.replace(/^\s*[-*] /, ""));
      return;
    }
    flushList(`l${i}`);
    if (/^###?\s+/.test(line)) {
      const lvl = line.startsWith("###") ? 3 : 2;
      const txt = line.replace(/^#{1,3}\s+/, "");
      out.push(
        lvl === 3 ? (
          <h3 key={i} className="mt-3 mb-1 text-base font-semibold">
            {inlineMd(txt)}
          </h3>
        ) : (
          <h2 key={i} className="mt-4 mb-1 text-lg font-semibold">
            {inlineMd(txt)}
          </h2>
        )
      );
      return;
    }
    if (!line.trim()) return;
    out.push(
      <p key={i} className="my-1.5">
        {inlineMd(line)}
      </p>
    );
  });
  flushList("last");
  if (inCode && codeBuf.length) {
    out.push(
      <pre key="trail" className="my-2 overflow-x-auto rounded-lg border bg-muted p-3 text-xs">
        <code>{codeBuf.join("\n")}</code>
      </pre>
    );
  }
  return out;
}

function inlineMd(text: string): React.ReactNode[] {
  // Split on `code` and **bold** with a combined regex.
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-xs">
          {p.slice(1, -1)}
        </code>
      );
    }
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

/* ── The chat itself ──────────────────────────────────────────── */

export function AiChat({
  history,
  context,
}: {
  history: AiHistoryItem[];
  context: AiContextData;
}) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<ChatMessage[]>(
    history.map((h) => ({ role: h.role, content: h.content }))
  );
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draftTopic, setDraftTopic] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await sendAiMessage({ messages: next });
      if ("text" in res) {
        setMessages([...next, { role: "assistant", content: res.text }]);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Something went wrong reaching the AI service.");
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    if (!confirm("Clear the whole AI conversation history?")) return;
    await clearAiHistory();
    setMessages([]);
    toast.success("Conversation cleared");
    router.refresh();
  }

  async function handleGenerateDraft() {
    const topic = draftTopic.trim();
    if (!topic || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await generateBlogDraft({ topic });
      if ("error" in res) {
        setError(res.error ?? "Failed to generate the draft.");
        return;
      }
      toast.success("Blog draft created — review it below");
      setDraftTopic("");
      router.push(`/admin/blog/${res.id}`);
    } catch {
      setError("Failed to generate the draft.");
    } finally {
      setGenerating(false);
    }
  }

  const totalSyncs = context.syncs.reduce((a, s) => a + s.total, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Chat column */}
      <Card className="flex min-h-[560px] flex-col">
        <CardContent className="flex flex-1 flex-col p-4">
          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-4" style={{ maxHeight: "60vh" }}>
            {messages.length === 0 && !sending && (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
                <AppIcon name="ai" size={44} className="text-primary" />
                <p className="font-display text-lg font-semibold">AI Admin Assistant</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Ask anything about your site — content ideas, SEO fixes, code-script
                  categories, or summarize what has been done so far. Replies come from the
                  DeepSeek API, not a mock.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl border px-4 py-3 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {m.role === "assistant" ? renderMd(m.content) : m.content}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 rounded-2xl border bg-muted px-4 py-3 text-sm text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Composer */}
          <div className="border-t pt-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask the AI assistant… (Enter to send, Shift+Enter for newline)"
              rows={2}
              className="mb-2 resize-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button onClick={handleSend} disabled={sending || !input.trim()}>
                <AppIcon name="mailSend" size={16} className="mr-2" />
                {sending ? "Sending…" : "Send"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear} disabled={sending}>
                <AppIcon name="delete" size={16} className="mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context / tools column */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
              <AppIcon name="sparkles" size={18} className="text-primary" />
              Generate blog draft
            </h3>
            <Textarea
              value={draftTopic}
              onChange={(e) => setDraftTopic(e.target.value)}
              placeholder="e.g. Top 10 PHP scripts for ecommerce in 2026"
              rows={2}
              className="mb-2 resize-none"
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={handleGenerateDraft}
              disabled={generating || !draftTopic.trim()}
            >
              <AppIcon name="ai" size={16} className="mr-2" />
              {generating ? "Writing…" : "Generate draft"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Saves as a <Badge variant="gold" className="ml-1">draft</Badge> post for review.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
              <AppIcon name="dashboard" size={18} className="text-primary" />
              What have you done so far?
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Code scripts</dt>
                <dd className="font-semibold">{context.counts.code_scripts ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Blog posts</dt>
                <dd className="font-semibold">{context.counts.blog_posts ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Study materials</dt>
                <dd className="font-semibold">{context.counts.study_materials ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ad units</dt>
                <dd className="font-semibold">{context.counts.ads ?? 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Unread messages</dt>
                <dd className="font-semibold">{context.counts.messages ?? 0}</dd>
              </div>
              <div className="flex justify-between border-t pt-2">
                <dt className="text-muted-foreground">Scripts imported (syncs)</dt>
                <dd className="font-semibold">{totalSyncs}</dd>
              </div>
            </dl>
            {context.recent.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent activity
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {context.recent.map((r, i) => (
                    <li key={i} className="truncate">
                      • {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
