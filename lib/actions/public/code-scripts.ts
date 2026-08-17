"use server";

import type { CodeScript } from "@/lib/code-scripts";
import { createClient } from "@/lib/supabase/server";

export type CodeScriptCard = Pick<
  CodeScript,
  "id" | "title" | "slug" | "category" | "version" | "cover_image" | "content" | "created_at"
>;

/** Fetch one page of published scripts for the infinite-scroll listing. */
export async function getMoreCodeScripts(input: {
  category?: string;
  offset: number;
  limit: number;
}): Promise<CodeScriptCard[]> {
  const db = await createClient();
  let q = db
    .from("code_scripts")
    .select("id, title, slug, category, version, cover_image, content, created_at")
    .eq("status", "published");
  if (input.category) q = q.eq("category", input.category);
  const { data } = await q
    .order("created_at", { ascending: false })
    .range(input.offset, input.offset + input.limit - 1);
  return (data ?? []) as CodeScriptCard[];
}
