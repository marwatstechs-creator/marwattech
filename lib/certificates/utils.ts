import type { SupabaseClient } from "@supabase/supabase-js";

import { SITE } from "@/lib/constants";
import { getSiteSettings } from "@/lib/db/content";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { CertificateJson, CertificateSignature } from "./types";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

/** Cryptographically-random verification code (8 chars, unambiguous). */
export function newVerificationCode(length = 8): string {
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[arr[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** Public verification URL used by the QR code. */
export function certificateVerifyUrl(code: string): string {
  return `${SITE.url}/certificate/verify/${code}`;
}

export type CompletionCheck = { total: number; done: number; complete: boolean };

/**
 * A course is "complete" when every lesson has a `completed` row in
 * lesson_progress for this client (no separate quiz/assessment system exists).
 */
export async function checkCourseCompletion(
  db: SupabaseClient<Database>,
  clientId: string,
  courseId: string
): Promise<CompletionCheck> {
  const { data: lessonRows } = await db
    .from("course_lessons")
    .select("id")
    .eq("course_id", courseId);
  const lessonIds = (lessonRows ?? []).map((l) => l.id);
  const total = lessonIds.length;

  let done = 0;
  if (lessonIds.length) {
    const { data } = await db
      .from("lesson_progress")
      .select("id")
      .eq("client_id", clientId)
      .eq("completed", true)
      .in("lesson_id", lessonIds);
    done = (data ?? []).length;
  }

  return { total, done, complete: total > 0 && done >= total };
}

/** Resolve director/instructor signature names from Site settings (with defaults). */
export async function getCertificateSignatures(db: SupabaseClient<Database>): Promise<{
  director: CertificateSignature;
  instructor: CertificateSignature;
}> {
  const settings = await getSiteSettings(db);
  return {
    director: {
      name: settings["certificate_director_name"]?.trim() || "Marwat Tech Director",
      title: settings["certificate_director_title"]?.trim() || "Director / Authorized Signatory",
      image: settings["certificate_director_signature"]?.trim() || null,
    },
    instructor: {
      name: settings["certificate_instructor_name"]?.trim() || "Course Instructor",
      title: "Course Instructor",
      image: settings["certificate_instructor_signature"]?.trim() || null,
    },
  };
}

export type BuildCertificateJsonInput = {
  certificateId: string;
  verificationCode: string;
  issueDate: string;
  completionDate: string;
  student: { id: string; name: string; email: string };
  course: {
    id: string;
    title: string;
    category?: string | null;
    instructor?: string | null;
    duration?: string | null;
  };
  signatures: { director: CertificateSignature; instructor: CertificateSignature };
};

/** Build the full certificate JSON payload (per the schema). */
export function buildCertificateJson(input: BuildCertificateJsonInput): CertificateJson {
  return {
    certificate: {
      id: input.certificateId,
      verification_code: input.verificationCode,
      status: "issued",
      issue_date: input.issueDate,
      completion_date: input.completionDate,
    },
    student: {
      id: input.student.id,
      name: input.student.name,
      email: input.student.email,
    },
    course: {
      id: input.course.id,
      title: input.course.title,
      category: input.course.category ?? undefined,
      instructor: input.course.instructor ?? undefined,
      duration: input.course.duration ?? undefined,
    },
    platform: {
      name: SITE.name,
      website: SITE.url,
      logo: `${SITE.url}/assets/logo-light-square.svg`,
    },
    signatures: input.signatures,
  };
}

/** RLS server client (used by server-only helpers). */
export async function certificateDb() {
  return createClient();
}
