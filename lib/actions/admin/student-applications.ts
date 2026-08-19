"use server";

import { revalidatePath } from "next/cache";

import { requireStaff, logActivity } from "@/lib/actions/admin/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminStudentApplication = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

/** List all student applications, newest first (staff only). */
export async function listStudentApplications(): Promise<AdminStudentApplication[]> {
  const { db } = await requireStaff();
  const { data } = await db
    .from("student_applications")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as AdminStudentApplication[];
}

/**
 * Approve or reject a student application. Approving promotes the user to the
 * "student" role (unlocking courses + study materials in their dashboard).
 */
export async function reviewStudentApplication(
  id: string,
  approve: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { session, db } = await requireStaff();
  if (!id) return { ok: false, error: "Invalid application." };

  const admin = createAdminClient();
  const { data: app } = await admin
    .from("student_applications")
    .select("user_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!app || app.status !== "pending") {
    return { ok: false, error: "Application not found or already reviewed." };
  }

  if (approve) {
    const { error: roleErr } = await admin
      .from("profiles")
      .update({ role: "student" })
      .eq("id", app.user_id);
    if (roleErr) return { ok: false, error: roleErr.message };
  }

  const { error } = await admin
    .from("student_applications")
    .update({
      status: approve ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity(db, session, approve ? "student_approved" : "student_rejected", "student_applications", id, {
    user_id: app.user_id,
  });
  revalidatePath("/admin/student-applications");
  return { ok: true };
}
