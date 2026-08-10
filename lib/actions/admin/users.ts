"use server";

import { z } from "zod";
import { requireSuperAdmin, logActivity } from "@/lib/actions/admin/helpers";

const roleSchema = z.enum(["super_admin", "editor", "support"]);

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

export async function createAdminUser(email: string, password: string, role: z.infer<typeof roleSchema>, fullName?: string) {
  const { session, db } = await requireSuperAdmin();
  const parsedRole = roleSchema.safeParse(role);
  if (!parsedRole.success) return { error: "Invalid role" };
  if (!z.string().email().safeParse(email).success) return { error: "Invalid email" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const { data, error } = await db.auth.admin.createUser({
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
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete_user", "user", userId);
  return { ok: true };
}
