"use server";

import { z } from "zod";

import {
  requireSuperAdmin,
  logActivity,
  type DB,
} from "@/lib/actions/admin/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import {
  adminResetPasswordEmail,
  adminConfirmationEmail,
} from "@/lib/email/templates";
import {
  isValidPhone,
  isValidAvatarUrl,
  isRole,
  isStaffRole,
  isStrongPassword,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/admin/user-validation";

const roleSchema = z.enum(["super_admin", "editor", "support", "client"]);
const staffRoleSchema = z.enum(["super_admin", "editor", "support"]);

const detailSchema = z.object({
  full_name: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  avatar_url: z.string().max(500).optional().or(z.literal("")),
});

const emailSchema = z.string().email().max(320);

function normalize(s: string | undefined): string | null {
  return s && s.trim() ? s.trim() : null;
}

async function getUserEmail(userId: string): Promise<string | null> {
  const adminDb = createAdminClient();
  const { data } = await adminDb.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

/**
 * GoTrue admin REST calls with the service-role key (server only).
 * Used instead of supabase-js admin methods where the client library's
 * types are missing fields (banned_until) or over-require params (signup
 * generate_link needs a password in the client types, but not at runtime).
 */
const adminUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function adminGenerateLink(type: "signup" | "recovery", email: string): Promise<string> {
  const res = await fetch(`${adminUrl()}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: serviceKey(),
      Authorization: `Bearer ${serviceKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, email }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    properties?: { action_link?: string };
    error_description?: string;
  };
  if (!res.ok || !body.properties?.action_link) {
    throw new Error(body.error_description ?? `HTTP ${res.status}`);
  }
  return body.properties.action_link;
}

async function adminSetBan(userId: string, banned: boolean): Promise<void> {
  const res = await fetch(
    `${adminUrl()}/auth/v1/admin/users/${userId}/${banned ? "ban" : "unban"}`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey(),
        Authorization: `Bearer ${serviceKey()}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
}

/**
 * Simple DB-backed rate limiter for admin email actions (reset link,
 * confirmation resend, force-reset). Counts recent activity-log entries for
 * the same action + target user within the window; reuse of activity_logs
 * keeps this dependency-free and durable across worker restarts.
 */
async function checkRateLimit(
  db: DB,
  action: string,
  userId: string,
  max = RATE_LIMIT_MAX,
  windowMs = RATE_LIMIT_WINDOW_MS
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - windowMs).toISOString();
    const { count } = await db
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", action)
      .eq("entity_id", userId)
      .gte("created_at", since);
    return (count ?? 0) >= max;
  } catch {
    // Fail open — never block an admin action because logging is down.
    return false;
  }
}

/* ── Role ──────────────────────────────────────────────────────────────── */

export async function updateUserRole(userId: string, role: z.infer<typeof roleSchema>) {
  const { session, db } = await requireSuperAdmin();
  if (userId === session.user.id) {
    return { error: "You cannot change your own role." };
  }
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success || !isRole(parsed.data)) return { error: "Invalid role" };
  const { error } = await db.from("profiles").update({ role: parsed.data }).eq("id", userId);
  if (error) return { error: error.message };
  await logActivity(db, session, "role_change", "user", userId, { role: parsed.data });
  return { ok: true };
}

/* ── Details (name, phone, avatar) ─────────────────────────────────────── */

export async function updateUserDetails(userId: string, input: z.infer<typeof detailSchema>) {
  const { session, db } = await requireSuperAdmin();
  const parsed = detailSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid details" };
  if (!isValidPhone(parsed.data.phone)) return { error: "Invalid phone number." };
  if (!isValidAvatarUrl(parsed.data.avatar_url)) return { error: "Invalid avatar URL." };
  const { error } = await db
    .from("profiles")
    .update({
      full_name: normalize(parsed.data.full_name),
      phone: normalize(parsed.data.phone),
      avatar_url: normalize(parsed.data.avatar_url),
    })
    .eq("id", userId);
  if (error) return { error: error.message };
  await logActivity(db, session, "profile_update", "user", userId, {
    full_name: normalize(parsed.data.full_name),
    phone: normalize(parsed.data.phone),
  });
  return { ok: true };
}

/* ── Password ──────────────────────────────────────────────────────────── */

export async function resetUserPassword(userId: string, password: string) {
  const { session, db } = await requireSuperAdmin();
  if (!isStrongPassword(password)) {
    return { error: "Password must be at least 8 characters and include letters and numbers." };
  }
  if (await checkRateLimit(db, "password_reset", userId)) {
    return { error: "Too many reset attempts for this user. Please try again later." };
  }
  const adminDb = createAdminClient();
  const { error } = await adminDb.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  await logActivity(db, session, "password_reset", "user", userId);
  return { ok: true };
}

export async function sendPasswordResetLink(userId: string) {
  const { session, db } = await requireSuperAdmin();
  if (await checkRateLimit(db, "send_reset_link", userId)) {
    return { error: "Too many reset emails. Please try again in a few minutes." };
  }
  const email = await getUserEmail(userId);
  if (!email) return { error: "No email address on this account." };

  let resetUrl: string;
  try {
    resetUrl = await adminGenerateLink("recovery", email);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not generate a reset link." };
  }
  const { data: profile } = await db.from("profiles").select("full_name").eq("id", userId).single();

  try {
    await sendEmail({
      to: email,
      subject: "Reset your password — Marwat Tech",
      html: adminResetPasswordEmail({
        name: profile?.full_name ?? null,
        resetUrl,
      }),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not send the email." };
  }
  await logActivity(db, session, "send_reset_link", "user", userId, { email });
  return { ok: true };
}

export async function resendConfirmationEmail(userId: string) {
  const { session, db } = await requireSuperAdmin();
  if (await checkRateLimit(db, "send_confirmation_link", userId)) {
    return { error: "Too many confirmation emails. Please try again in a few minutes." };
  }
  const email = await getUserEmail(userId);
  if (!email) return { error: "No email address on this account." };

  let confirmUrl: string;
  try {
    confirmUrl = await adminGenerateLink("signup", email);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not generate a confirmation link." };
  }
  const { data: profile } = await db.from("profiles").select("full_name").eq("id", userId).single();

  try {
    await sendEmail({
      to: email,
      subject: "Confirm your email — Marwat Tech",
      html: adminConfirmationEmail({
        name: profile?.full_name ?? null,
        confirmUrl,
      }),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not send the email." };
  }
  await logActivity(db, session, "send_confirmation_link", "user", userId, { email });
  return { ok: true };
}

/* ── Suspend / activate ───────────────────────────────────────────────── */

export async function setUserSuspended(userId: string, suspend: boolean) {
  const { session, db } = await requireSuperAdmin();
  if (userId === session.user.id) {
    return { error: "You cannot suspend your own account." };
  }
  try {
    await adminSetBan(userId, suspend);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update account status." };
  }
  await logActivity(db, session, suspend ? "user_suspend" : "user_unsuspend", "user", userId);
  return { ok: true };
}

/* ── Create / delete ──────────────────────────────────────────────────── */

export async function createAdminUser(
  email: string,
  password: string,
  role: z.infer<typeof staffRoleSchema>,
  fullName?: string
) {
  const { session, db } = await requireSuperAdmin();
  const parsedRole = staffRoleSchema.safeParse(role);
  if (!parsedRole.success || !isStaffRole(parsedRole.data)) {
    return { error: "Invalid role" };
  }
  if (!emailSchema.safeParse(email).success) return { error: "Invalid email" };
  if (!isStrongPassword(password)) {
    return { error: "Password must be at least 8 characters and include letters and numbers." };
  }

  const adminDb = createAdminClient();
  const { data, error } = await adminDb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) return { error: error.message };

  const { error: profileError } = await db
    .from("profiles")
    .update({ role: parsedRole.data, full_name: fullName || null })
    .eq("id", data.user.id);
  if (profileError) return { error: profileError.message };

  await logActivity(db, session, "create_user", "user", data.user.id, { role: parsedRole.data });
  return { id: data.user.id };
}

export async function deleteAdminUser(userId: string) {
  const { session, db } = await requireSuperAdmin();
  if (userId === session.user.id) {
    return { error: "You cannot delete your own account." };
  }
  const adminDb = createAdminClient();
  const { error } = await adminDb.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete_user", "user", userId);
  return { ok: true };
}

/* ── Activity ──────────────────────────────────────────────────────────── */

export async function getUserActivity(userId: string) {
  const { db } = await requireSuperAdmin();
  const { data } = await db
    .from("activity_logs")
    .select("id, user_id, action, entity_type, entity_id, metadata, created_at")
    .or(`user_id.eq.${userId},entity_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}
