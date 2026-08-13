"use server";

import { z } from "zod";

import {
  requireSuperAdmin,
  logActivity,
} from "@/lib/actions/admin/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import {
  adminResetPasswordEmail,
  adminConfirmationEmail,
} from "@/lib/email/templates";

const roleSchema = z.enum(["super_admin", "editor", "support", "client"]);
const staffRoleSchema = z.enum(["super_admin", "editor", "support"]);

const detailSchema = z.object({
  full_name: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  avatar_url: z.string().max(500).optional().or(z.literal("")),
});

const passwordSchema = z.string().min(8).max(200);
const emailSchema = z.string().email().max(320);

function normalize(s: string | undefined): string | null {
  return s && s.trim() ? s.trim() : null;
}

async function getUserEmail(userId: string): Promise<string | null> {
  const adminDb = createAdminClient();
  const { data } = await adminDb.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

/* ── Role ──────────────────────────────────────────────────────────────── */

export async function updateUserRole(userId: string, role: z.infer<typeof roleSchema>) {
  const { session, db } = await requireSuperAdmin();
  if (userId === session.user.id) {
    return { error: "You cannot change your own role." };
  }
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { error: "Invalid role" };
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
  if (!passwordSchema.safeParse(password).success) {
    return { error: "Password must be at least 8 characters." };
  }
  const adminDb = createAdminClient();
  const { error } = await adminDb.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  await logActivity(db, session, "password_reset", "user", userId);
  return { ok: true };
}

/* ── Email links (reset / confirm) ────────────────────────────────────── */

export async function sendPasswordResetLink(userId: string) {
  const { session, db } = await requireSuperAdmin();
  const email = await getUserEmail(userId);
  if (!email) return { error: "No email address on this account." };

  const adminDb = createAdminClient();
  const { data, error } = await adminDb.auth.admin.generateLink({ type: "recovery", email });
  if (error || !data?.properties?.action_link) {
    return { error: error?.message ?? "Could not generate a reset link." };
  }
  const { data: profile } = await db.from("profiles").select("full_name").eq("id", userId).single();

  try {
    await sendEmail({
      to: email,
      subject: "Reset your password — Marwat Tech",
      html: adminResetPasswordEmail({
        name: profile?.full_name ?? null,
        resetUrl: data.properties.action_link,
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
  const email = await getUserEmail(userId);
  if (!email) return { error: "No email address on this account." };

  const adminDb = createAdminClient();
  const { data, error } = await adminDb.auth.admin.generateLink({ type: "signup", email });
  if (error || !data?.properties?.action_link) {
    return { error: error?.message ?? "Could not generate a confirmation link." };
  }
  const { data: profile } = await db.from("profiles").select("full_name").eq("id", userId).single();

  try {
    await sendEmail({
      to: email,
      subject: "Confirm your email — Marwat Tech",
      html: adminConfirmationEmail({
        name: profile?.full_name ?? null,
        confirmUrl: data.properties.action_link,
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
  const adminDb = createAdminClient();
  const bannedUntil = suspend
    ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10).toISOString() // ~10 years
    : null;
  const { error } = await adminDb.auth.admin.updateUserById(userId, { banned_until: bannedUntil });
  if (error) return { error: error.message };
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
  if (!parsedRole.success) return { error: "Invalid role" };
  if (!emailSchema.safeParse(email).success) return { error: "Invalid email" };
  if (!passwordSchema.safeParse(password).success) {
    return { error: "Password must be at least 8 characters" };
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
    .select("id, action, entity_type, entity_id, metadata, created_at")
    .or(`user_id.eq.${userId},entity_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}
