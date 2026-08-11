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

/**
 * Find-or-create a Supabase account for a verified external identity
 * (Google / PayPal), then sign them in server-side via a magic-link OTP
 * (no password change required). Returns the dashboard path by role.
 */
export async function signInWithVerifiedEmail(opts: {
  email: string;
  name?: string | null;
  picture?: string | null;
}): Promise<{ target: "/admin" | "/client"; error?: string }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const email = opts.email.toLowerCase();

  // 1) Find the account by email; auto-create a client account if missing.
  const { data: users } = await admin.auth.admin.listUsers();
  let user = users?.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: opts.name ?? email.split("@")[0],
        ...(opts.picture ? { avatar_url: opts.picture } : {}),
      },
    });
    if (createErr) return { target: "/client", error: createErr.message };
    user = created?.user ?? undefined;
  }
  if (!user) return { target: "/client", error: "No user account found" };

  // 2) Generate a magic-link OTP and complete it server-side (sets the cookie).
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const token = linkData?.properties?.hashed_token;
  if (!token) return { target: "/client", error: "Could not generate sign-in link" };

  const db = await createClient();
  const { error: verifyErr } = await db.auth.verifyOtp({
    email,
    token,
    type: "magiclink",
  });
  if (verifyErr) return { target: "/client", error: verifyErr.message };

  // Sync the external provider's profile picture + display name into the
  // profiles table so the dashboard avatar shows it (e.g. Google avatar).
  if (user && (opts.picture || opts.name)) {
    const patch: { full_name?: string; avatar_url?: string } = {};
    if (opts.name) patch.full_name = opts.name;
    if (opts.picture) patch.avatar_url = opts.picture;
    await admin.from("profiles").update(patch).eq("id", user.id);
  }

  // 3) Route to the right dashboard based on role.
  const {
    data: { user: sessUser },
  } = await db.auth.getUser();
  let isStaff = false;
  if (sessUser) {
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", sessUser.id)
      .single();
    isStaff = ["super_admin", "editor", "support"].includes(String(profile?.role));
  }
  return { target: isStaff ? "/admin" : "/client" };
}
