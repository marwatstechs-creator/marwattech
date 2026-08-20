"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth";
import {
  buildCertificateJson,
  checkCourseCompletion,
  getCertificateSignatures,
  newVerificationCode,
} from "@/lib/certificates/utils";
import type { CertificateRow } from "@/lib/certificates/types";
import { createClient } from "@/lib/supabase/server";

export type GenerateCertificateResult =
  | { ok: true; certificate: CertificateRow }
  | { ok: false; error: string };

/**
 * Generates (or returns the existing) completion certificate for a course the
 * signed-in client has fully completed.
 */
export async function generateCertificate(
  courseId: string
): Promise<GenerateCertificateResult> {
  const session = await getSessionUser();
  if (
    !session ||
    (session.profile.role !== "client" && session.profile.role !== "student")
  ) {
    return { ok: false, error: "You must be signed in." };
  }
  const db = await createClient();
  const clientId = session.user.id;

  const { data: course } = await db
    .from("courses")
    .select("id, title, category, duration_hours")
    .eq("id", courseId)
    .single();
  if (!course) return { ok: false, error: "Course not found." };

  const comp = await checkCourseCompletion(db, clientId, courseId);
  if (!comp.complete) {
    return {
      ok: false,
      error: `Complete all ${comp.total} lessons (${comp.done} done) before generating a certificate.`,
    };
  }

  // Already issued (non-revoked) → return it.
  const { data: existing } = await db
    .from("certificates")
    .select("*")
    .eq("student_id", clientId)
    .eq("course_id", courseId)
    .neq("status", "revoked")
    .maybeSingle();
  if (existing) return { ok: true, certificate: existing as CertificateRow };

  const today = new Date().toISOString().slice(0, 10);
  const signatures = await getCertificateSignatures(db);
  const studentName = session.profile.full_name?.trim() || "Student";
  const durationText = course.duration_hours
    ? `${course.duration_hours} ${course.duration_hours === 1 ? "Hour" : "Hours"}`
    : null;

  // Reserve the certificate number from the sequence BEFORE inserting (never an
  // empty placeholder), and retry on unique-constraint collisions. This is safe
  // even if the sequence is out of sync with existing/seed certificates (e.g.
  // the seed CERT-2026-000001), or two requests race: each retry advances the
  // sequence and uses a fresh verification code.
  const MAX_ATTEMPTS = 8;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const certificateId = crypto.randomUUID();
    const verificationCode = newVerificationCode();

    const { data: noData } = await db.rpc("generate_certificate_no");
    const certificateNo = typeof noData === "string" && noData ? noData : "";
    if (!certificateNo) {
      return { ok: false, error: "Could not generate a certificate number. Please try again." };
    }

    const metadata = buildCertificateJson({
      certificateId,
      verificationCode,
      issueDate: today,
      completionDate: today,
      student: { id: clientId, name: studentName, email: session.user.email ?? "" },
      course: {
        id: course.id,
        title: course.title,
        category: course.category,
        instructor: signatures.instructor.name,
        duration: durationText,
      },
      signatures,
    });

    const { data: cert, error } = await db
      .from("certificates")
      .insert({
        id: certificateId,
        certificate_no: certificateNo,
        verification_code: verificationCode,
        student_id: clientId,
        course_id: courseId,
        student_name: studentName,
        course_title: course.title,
        course_category: course.category,
        instructor_name: signatures.instructor.name,
        course_duration: durationText,
        status: "issued",
        issue_date: today,
        completion_date: today,
        metadata,
      })
      .select("*")
      .single();

    // A unique-constraint collision → the number/code was taken; retry once more.
    const isDuplicate = error && /duplicate key|unique constraint|23505/i.test(error.message);
    if (error && !isDuplicate) {
      return { ok: false, error: error?.message || "Could not generate the certificate." };
    }
    if (error) continue;

    if (!cert) {
      return { ok: false, error: "Could not generate the certificate." };
    }

    await db
      .from("enrollments")
      .update({ completed_at: today })
      .eq("client_id", clientId)
      .eq("course_id", courseId);

    revalidatePath("/client/certificates");
    revalidatePath(`/certificate/${certificateId}`);
    return { ok: true, certificate: cert as CertificateRow };
  }

  return {
    ok: false,
    error: "Could not generate a unique certificate number. Please try again.",
  };
}

/** All certificates for the signed-in client. */
export async function getMyCertificates(): Promise<CertificateRow[]> {
  const session = await getSessionUser();
  if (!session) return [];
  const db = await createClient();
  const { data } = await db
    .from("certificates")
    .select("*")
    .eq("student_id", session.user.id)
    .order("created_at", { ascending: false });
  return (data ?? []) as CertificateRow[];
}
