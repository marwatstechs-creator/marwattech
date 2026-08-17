"use server";

import { z } from "zod";

import { requireEditor, logActivity, revalidateContent } from "@/lib/actions/admin/helpers";
import { CODE_SCRIPT_CATEGORIES } from "@/lib/code-scripts";

const statusSchema = z.enum(["published", "draft", "archived"]);
const categorySchema = z
  .string()
  .max(80)
  .optional()
  .or(z.literal(""))
  .or(z.enum([...CODE_SCRIPT_CATEGORIES.map((c) => c.slug)] as [string, ...string[]]));

const updateSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  category: z.string().max(80).nullable().optional(),
  version: z.string().max(40).nullable().optional(),
  content: z.string().max(20000).nullable().optional(),
  excerpt: z.string().max(400).nullable().optional(),
  cover_image: z.string().max(1000).nullable().optional(),
  download_url: z.string().max(2000).nullable().optional(),
  seo_title: z.string().max(300).nullable().optional(),
  seo_description: z.string().max(400).nullable().optional(),
});

function norm(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

/** Admin list of all code scripts + counts. */
export async function getCodeScripts() {
  const { db } = await requireEditor();
  const [rows, counts] = await Promise.all([
    db
      .from("code_scripts")
      .select("id, title, slug, category, version, status, cover_image, source_url, updated_at")
      .order("updated_at", { ascending: false })
      .limit(2000),
    db.from("code_scripts").select("status", { count: "exact", head: true }),
  ]);
  return {
    rows: rows.data ?? [],
    total: counts.count ?? 0,
  };
}

/** Full row for the edit dialog. */
export async function getCodeScriptDetails(id: string) {
  const { db } = await requireEditor();
  const { data } = await db
    .from("code_scripts")
    .select(
      "id, title, slug, category, version, content, excerpt, cover_image, download_url, source_url, seo_title, seo_description, faqs"
    )
    .eq("id", id)
    .single();
  return data ?? null;
}

/** Sync history + pending request state (for the admin panel). */
export async function getCodeScriptSyncs() {
  const { db } = await requireEditor();
  const [runs, requests] = await Promise.all([
    db.from("code_script_syncs").select("*").order("ran_at", { ascending: false }).limit(100),
    db
      .from("code_script_sync_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  return {
    runs: runs.data ?? [],
    requests: requests.data ?? [],
  };
}

/** Queue a manual "Sync now" — the VPS runner picks it up within ~15 min. */
export async function requestCodeScriptSync() {
  const { session, db } = await requireEditor();
  const { error } = await db.from("code_script_sync_requests").insert({ status: "pending" });
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "code_scripts", undefined, { sync_requested: true });
  return { ok: true };
}

export async function updateCodeScript(id: string, input: z.infer<typeof updateSchema>) {
  const { session, db } = await requireEditor();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const d = parsed.data;
  const patch = {
    ...(d.title !== undefined ? { title: norm(d.title) ?? "" } : {}),
    ...(d.category !== undefined ? { category: norm(d.category) } : {}),
    ...(d.version !== undefined ? { version: norm(d.version) } : {}),
    ...(d.content !== undefined ? { content: d.content } : {}),
    ...(d.excerpt !== undefined ? { excerpt: norm(d.excerpt) } : {}),
    ...(d.cover_image !== undefined ? { cover_image: norm(d.cover_image) } : {}),
    ...(d.download_url !== undefined ? { download_url: norm(d.download_url) } : {}),
    ...(d.seo_title !== undefined ? { seo_title: norm(d.seo_title) } : {}),
    ...(d.seo_description !== undefined ? { seo_description: norm(d.seo_description) } : {}),
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from("code_scripts").update(patch).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "code_scripts", id, { patch: Object.keys(patch) });
  revalidateContent(["/code-scripts"]);
  return { ok: true };
}

export async function setCodeScriptStatus(id: string, status: z.infer<typeof statusSchema>) {
  const { session, db } = await requireEditor();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: "Invalid status" };
  const { error } = await db
    .from("code_scripts")
    .update({ status: parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "code_scripts", id, { status: parsed.data });
  revalidateContent(["/code-scripts"]);
  return { ok: true };
}

export async function deleteCodeScript(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("code_scripts").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "code_scripts", id);
  revalidateContent(["/code-scripts"]);
  return { ok: true };
}
