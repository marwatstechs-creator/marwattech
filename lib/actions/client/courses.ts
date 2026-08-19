"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseVideoUrl, youtubeEmbedUrl } from "@/lib/video";

export type ClientCourseActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Enroll the signed-in user in a course. Idempotent — enrolling twice is a
 * no-op (unique client_id + course_id). Works for both free and paid courses
 * (no payment gate, per product decision).
 */
export async function enrollInCourse(
  courseId: string
): Promise<ClientCourseActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You're not signed in." };
  if (session.profile.role !== "student") {
    return { ok: false, error: "Only approved students can enroll in courses." };
  }
  if (!courseId || courseId.length < 8) {
    return { ok: false, error: "Invalid course." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("enrollments")
      .upsert(
        { client_id: session.user.id, course_id: courseId },
        { onConflict: "client_id,course_id", ignoreDuplicates: true }
      );
    if (error) return { ok: false, error: error.message };

    revalidatePath("/client/courses", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not enroll — please try again." };
  }
}

/**
 * Resolve the playback source for a lesson, ONLY when the caller is allowed
 * (enrolled in the course, the lesson is a free preview, or staff).
 *
 * Returns the final player URL — a YouTube nocookie embed for YouTube links,
 * or the in-house media proxy path for Google Drive. The raw video URL is
 * never sent to the client; it only ever lives on the server.
 */
export async function getLessonPlayback(lessonId: string): Promise<
  | { ok: true; kind: "youtube" | "drive" | "other"; src: string | null }
  | { ok: false; error: string }
> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You're not signed in." };

  try {
    const admin = createAdminClient();
    const { data: lesson } = await admin
      .from("course_lessons")
      .select("id, course_id, video_url, is_free_preview")
      .eq("id", lessonId)
      .single();

    if (!lesson) return { ok: false, error: "Lesson not found." };

    const staff = ["super_admin", "editor", "support"].includes(
      session.profile.role
    );
    const isStudent = session.profile.role === "student";
    // Only staff and approved students may watch lessons.
    if (!staff && !isStudent) {
      return { ok: false, error: "Only students can access course content." };
    }

    // Authorize: staff, free preview, or enrolled in the course.
    let allowed = staff || lesson.is_free_preview;
    if (!allowed) {
      const { data: enrollment } = await admin
        .from("enrollments")
        .select("id")
        .eq("client_id", session.user.id)
        .eq("course_id", lesson.course_id)
        .maybeSingle();
      allowed = !!enrollment;
    }
    if (!allowed) {
      return { ok: false, error: "Enroll in this course to watch the videos." };
    }

    const parsed = parseVideoUrl(lesson.video_url);
    if (!parsed) return { ok: true, kind: "other", src: null };
    if (parsed.kind === "youtube") {
      return { ok: true, kind: "youtube", src: youtubeEmbedUrl(parsed.id) };
    }
    // Drive → always through our proxy so the Drive URL never reaches the browser.
    return {
      ok: true,
      kind: "drive",
      src: `/api/media/lesson/${lesson.id}`,
    };
  } catch {
    return { ok: false, error: "Could not load the video." };
  }
}

/**
 * Mark a lesson complete / incomplete for the signed-in client.
 * RLS already lets clients write their own lesson_progress rows.
 */
export async function setLessonProgress(
  lessonId: string,
  completed: boolean
): Promise<ClientCourseActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You're not signed in." };

  try {
    const db = await createClient();
    const { error } = await db.from("lesson_progress").upsert(
      {
        client_id: session.user.id,
        lesson_id: lessonId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "client_id,lesson_id" }
    );
    if (error) return { ok: false, error: error.message };

    revalidatePath("/client/courses", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save progress." };
  }
}
