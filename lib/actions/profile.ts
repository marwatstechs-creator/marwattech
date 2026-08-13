"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProfileActionResult =
  | { ok: true; url?: string }
  | { ok: false; error: string };

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
