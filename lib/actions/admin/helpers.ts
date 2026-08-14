import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import type { Database } from "@/types/database";

export type DB = SupabaseClient<Database>;

async function makeClient(): Promise<DB> {
  return await createClient();
}

/** Roles allowed to use the admin console and admin server actions. */
const ADMIN_ROLES: string[] = ["super_admin", "editor", "support"];

/** Returns the session + a RLS-respecting server client, redirecting if needed. */
export async function requireStaff() {
  const session = await getSessionUser();
  if (!session) redirect("/admin/login");
  // Enforce the role here (not just in the layout) so every admin server
  // action is protected even when it is called directly.
  if (!ADMIN_ROLES.includes(session.profile.role)) redirect("/admin");
  const db = await makeClient();
  return { session, db };
}

export async function requireEditor() {
  const session = await getSessionUser();
  if (!session) redirect("/admin/login");
  if (session.profile.role === "support") redirect("/admin");
  const db = await makeClient();
  return { session, db };
}

export async function requireSuperAdmin() {
  const session = await getSessionUser();
  if (!session) redirect("/admin/login");
  if (session.profile.role !== "super_admin") redirect("/admin");
  const db = await makeClient();
  return { session, db };
}

export async function logActivity(
  db: DB,
  session: { user: { id: string } } | null,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Database["public"]["Tables"]["activity_logs"]["Row"]["metadata"]
) {
  if (!session) return;
  try {
    await db.from("activity_logs").insert({
      user_id: session.user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch {
    // logging is best-effort
  }
}

/** Revalidate public pages after content changes. */
export async function revalidateContent(paths: string[]) {
  const { revalidatePath } = await import("next/cache");
  for (const p of paths) revalidatePath(p, "page");
  revalidatePath("/sitemap.xml", "page");

  // Notify Bing/Yandex/etc. instantly via IndexNow (the modern "ping").
  // Best-effort — never blocks the admin action.
  const { pingIndexNow } = await import("@/lib/indexnow");
  await pingIndexNow(paths);
}
