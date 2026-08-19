"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type StudentApplicationStatus =
  | "not_applied"
  | "pending"
  | "approved"
  | "rejected";

/** The user's student-application state (used by the profile card). */
export async function getStudentApplicationStatus(): Promise<StudentApplicationStatus> {
  const session = await getSessionUser();
  if (!session) return "not_applied";
  if (session.profile.role === "student") return "approved";
  try {
    const db = await createClient();
    const { data } = await db
      .from("student_applications")
      .select("status")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.status === "pending") return "pending";
    if (data?.status === "rejected") return "rejected";
    return "not_applied";
  } catch {
    return "not_applied";
  }
}

/** File a request to become a student. One pending application at a time. */
export async function applyAsStudent(
  message?: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You're not signed in." };
  if (session.profile.role === "student") {
    return { ok: false, error: "You're already a student." };
  }
  try {
    const db = await createClient();
    const { data: existing } = await db
      .from("student_applications")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("status", "pending")
      .maybeSingle();
    if (existing) {
      return { ok: false, error: "You already have a pending application." };
    }
    const { error } = await db.from("student_applications").insert({
      user_id: session.user.id,
      full_name: session.profile.full_name,
      email: session.user.email,
      message: message?.trim() ? message.trim().slice(0, 1000) : null,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/client/settings");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not submit your application. Please try again.",
    };
  }
}
