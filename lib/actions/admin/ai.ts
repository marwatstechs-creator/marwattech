"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
} from "@/lib/actions/admin/helpers";
import { createPost } from "@/lib/actions/admin/posts";

/* ────────────────────────────────────────────────────────────────
 * AI Admin Assistant
 *
 * A REAL backend — not a mock. Every call goes to the DeepSeek
 * chat-completions API (the same model family the Code Scripts sync
 * already uses on the VPS). The DEEPSEEK_API_KEY lives in the runtime
 * environment; if it is missing the actions fail loudly instead of
 * pretending to work.
 * ──────────────────────────────────────────────────────────────── */

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type AiMessage = ChatMessage | { role: "system"; content: string };

type DeepSeekResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

async function callDeepSeek(
  messages: AiMessage[],
  temperature = 0.7
): Promise<{ text: string; error?: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { text: "", error: "DEEPSEEK_API_KEY is not configured on the server." };
  }
  try {
    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature,
        max_tokens: 2000,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      return { text: "", error: `DeepSeek API error (${res.status})` };
    }
    const data = (await res.json()) as DeepSeekResponse;
    if (data.error?.message) return { text: "", error: data.error.message };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return { text: "", error: "Empty response from DeepSeek" };
    return { text };
  } catch (err) {
    return { text: "", error: err instanceof Error ? err.message : "Network error" };
  }
}

function systemPrompt(): string {
  return [
    "You are the Marwat Tech admin assistant — a helpful, concise AI for the site owner.",
    "You help manage www.marwattech.com: web development, ecommerce, SEO, WordPress,",
    "code scripts marketplace, blog, study materials and AdSense.",
    "Be practical and direct. When asked to generate content, write clean, original",
    "markdown. Never invent analytics; only reference data provided in the context.",
    "Keep answers tight unless the user asks for detail.",
  ].join(" ");
}

/* ── Context: "what have you done so far?" ────────────────────── */

export async function getAiContext() {
  const { db } = await requireEditor();
  const counts: Record<string, number> = {};
  for (const table of ["code_scripts", "blog_posts", "study_materials", "ads", "messages"] as const) {
    try {
      const { count } = await db
        .from(table)
        .select("id", { count: "exact", head: true });
      counts[table] = count ?? 0;
    } catch {
      counts[table] = 0;
    }
  }

  // Recent admin activity (last 10 actions).
  let recent: string[] = [];
  try {
    const { data } = await db
      .from("activity_logs")
      .select("action, entity_type, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    recent = (data ?? []).map(
      (a) => `${a.action}${a.entity_type ? " " + a.entity_type : ""}`
    );
  } catch {
    // ignore
  }

  // Recent code-script syncs (what the scraper has imported).
  let syncs: { total: number; at: string | null }[] = [];
  try {
    const { data } = await db
      .from("code_script_syncs")
      .select("imported, ran_at")
      .order("ran_at", { ascending: false })
      .limit(5);
    syncs = (data ?? []).map((s) => ({
      total: s.imported,
      at: s.ran_at,
    }));
  } catch {
    // ignore
  }

  return {
    counts,
    recent,
    syncs,
    generatedAt: new Date().toISOString(),
  };
}

/* ── Chat ─────────────────────────────────────────────────────── */

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(30),
});

export async function sendAiMessage(input: {
  messages: ChatMessage[];
}): Promise<{ text: string } | { error: string }> {
  const { session, db } = await requireEditor();
  const parsed = chatSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid message" };
  }

  const history = parsed.data.messages.slice(-20);
  const userMessage = history[history.length - 1];

  // Persist the user's message.
  await db.from("ai_messages").insert({
    user_id: session.user.id,
    role: "user",
    content: userMessage.content,
  });

  const reply = await callDeepSeek([
    { role: "system", content: systemPrompt() },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ]);

  if (reply.error) {
    return { error: reply.error };
  }

  // Persist the assistant's reply.
  await db.from("ai_messages").insert({
    user_id: session.user.id,
    role: "assistant",
    content: reply.text,
  });

  await logActivity(db, session, "ai_chat", "ai", undefined, {
    preview: userMessage.content.slice(0, 120),
  });

  return { text: reply.text };
}

export async function getAiHistory() {
  const { session, db } = await requireEditor();
  const { data } = await db
    .from("ai_messages")
    .select("role, content, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.created_at,
  }));
}

export async function clearAiHistory() {
  const { session, db } = await requireEditor();
  await db.from("ai_messages").delete().eq("user_id", session.user.id);
  await logActivity(db, session, "ai_history_cleared", "ai");
  return { ok: true };
}

/* ── Content generation (saved as drafts for review) ──────────── */

const genSchema = z.object({
  topic: z.string().min(3, "Topic is too short").max(200),
});

type GeneratedBlog = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
};

export async function generateBlogDraft(input: { topic: string }) {
  const { session, db } = await requireEditor();
  const parsed = genSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid topic" };
  }

  const reply = await callDeepSeek(
    [
      {
        role: "system",
        content:
          "You are a senior web-dev blogger for Marwat Tech. Write a complete blog post draft in JSON only: {\"title\":string,\"slug\":string,\"excerpt\":string,\"tags\":string[],\"content\":string(markdown, 600-1000 words)}. The content must be original, practical and SEO-friendly with headings, bullets and code blocks where useful. No extra text outside the JSON.",
      },
      { role: "user", content: `Topic: ${parsed.data.topic}` },
    ],
    0.8
  );

  if (reply.error) return { error: reply.error };

  let generated: GeneratedBlog;
  try {
    const cleaned = reply.text.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "");
    generated = JSON.parse(cleaned) as GeneratedBlog;
  } catch {
    return { error: "AI returned invalid JSON — please try again." };
  }
  if (!generated.title || !generated.content) {
    return { error: "AI response was incomplete — please try again." };
  }

  // Slug must be URL-safe; fall back to a generated one.
  const slug = (generated.slug ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || `draft-${Date.now().toString(36)}`;

  const result = await createPost({
    title: generated.title.slice(0, 250),
    slug,
    excerpt: (generated.excerpt ?? "").slice(0, 500),
    content: generated.content,
    custom_html: "",
    cover_image: "",
    tags: Array.isArray(generated.tags) ? generated.tags.slice(0, 5) : [],
    status: "draft",
    meta_title: generated.title.slice(0, 200),
    meta_description: (generated.excerpt ?? "").slice(0, 300),
  });

  if ("error" in result && result.error) return { error: result.error };

  await logActivity(db, session, "ai_generated_draft", "blog_post", result.id, {
    topic: parsed.data.topic,
  });

  return { id: result.id, slug };
}
