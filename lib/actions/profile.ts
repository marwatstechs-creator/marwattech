"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser, hasPassword } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isStrongPassword } from "@/lib/admin/user-validation";

export type ProfileActionResult =
  | { ok: true; url?: string }
  | { ok: false; error: string };

/**
 * Change the signed-in user's own password.
 *
 * Password-based accounts must confirm their current password (like normal
 * apps do). Google / GitHub-only accounts have no password to verify against,
 * so they can simply set a new one — and Google/GitHub sign-in keeps working
 * as before, independent of any password.
 */
export async function changePassword(input: {
  currentPassword?: string;
  newPassword: string;
}): Promise<ProfileActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You're not signed in." };

  const newPassword = input.newPassword;
  if (!isStrongPassword(newPassword)) {
    return {
      ok: false,
      error: "Password must be at least 8 characters with letters and numbers.",
    };
  }
  if (input.currentPassword && input.currentPassword === newPassword) {
    return { ok: false, error: "New password must be different from the current one." };
  }

  try {
    const db = await createClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user?.email) return { ok: false, error: "No email on this account." };

    const providers: string[] = (user.app_metadata?.providers as string[]) ?? [];

    if (hasPassword(providers)) {
      if (!input.currentPassword) {
        return { ok: false, error: "Enter your current password." };
      }
      const { error: signErr } = await db.auth.signInWithPassword({
        email: user.email,
        password: input.currentPassword,
      });
      if (signErr) return { ok: false, error: "Current password is incorrect." };
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin", "layout");
    revalidatePath("/client", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not change your password." };
  }
}

/** Update the signed-in user's display name. */
export async function updateProfileName(input: {
  fullName: string;
}): Promise<ProfileActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You're not signed in." };

  const name = input.fullName.trim().slice(0, 120);
  if (!name) return { ok: false, error: "Name can't be empty." };

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ full_name: name })
      .eq("id", session.user.id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin", "layout");
    revalidatePath("/client", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update your profile." };
  }
}

/**
 * Upload a new profile picture to the public `media` bucket (via the
 * service-role client so any role can update their own avatar) and store
 * its public URL on the profile.
 */
export async function uploadProfileAvatar(
  formData: FormData
): Promise<ProfileActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "You're not signed in." };

  const file = formData.get("avatar") as File | null;
  if (!file || !file.type.startsWith("image/")) {
    return { ok: false, error: "Please choose an image file." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { ok: false, error: "Image is too large (max 4 MB)." };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext =
      (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `avatars/${session.user.id}/${Date.now()}.${ext}`;

    const admin = createAdminClient();
    const { error: upErr } = await admin.storage
      .from("media")
      .upload(path, bytes, { contentType: file.type, upsert: true, cacheControl: "3600" });
    if (upErr) return { ok: false, error: upErr.message };

    const { data } = admin.storage.from("media").getPublicUrl(path);
    const url = data.publicUrl;

    const { error: dbErr } = await admin
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", session.user.id);
    if (dbErr) return { ok: false, error: dbErr.message };

    revalidatePath("/admin", "layout");
    revalidatePath("/client", "layout");
    return { ok: true, url };
  } catch {
    return { ok: false, error: "Upload failed — please try again." };
  }
}
