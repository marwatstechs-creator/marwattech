import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export type SessionWithProfile = {
  user: {
    id: string;
    email: string | undefined;
  };
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
  };
};

export async function getSessionUser(): Promise<SessionWithProfile | null> {
  try {
    const db = await createClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) return null;

    const { data: profile } = await db
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    return {
      user: { id: user.id, email: user.email ?? undefined },
      profile,
    };
  } catch {
    return null;
  }
}

export function canManageContent(role: UserRole) {
  return role === "super_admin" || role === "editor";
}

export function canManageMessages(role: UserRole) {
  return role === "super_admin" || role === "editor" || role === "support";
}

export function isSuperAdmin(role: UserRole) {
  return role === "super_admin";
}

export function isClient(role: UserRole) {
  return role === "client";
}

/** Server-side guard: redirect non-editors away from content pages. */
export async function guardEditor() {
  const session = await getSessionUser();
  if (!session) redirect("/admin/login");
  if (!canManageContent(session.profile.role)) redirect("/admin");
  return session;
}

/** Server-side guard: only super admins may proceed. */
export async function guardSuperAdmin() {
  const session = await getSessionUser();
  if (!session) redirect("/admin/login");
  if (!isSuperAdmin(session.profile.role)) redirect("/admin");
  return session;
}

/** Server-side guard: only clients may access client dashboard. */
export async function guardClient() {
  const session = await getSessionUser();
  if (!session) redirect("/client/login");
  if (session.profile.role !== "client") redirect("/admin/login");
  return session;
}
