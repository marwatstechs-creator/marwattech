"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
  revalidateContent,
} from "@/lib/actions/admin/helpers";

const materialSchema = z.object({
  title: z.string().min(2, "Title is required").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  file_url: z.string().min(1, "File URL is required").max(600),
  file_type: z.string().max(30).optional().or(z.literal("")),
  file_size: z.coerce.number().int().min(0).optional().or(z.literal("")),
  category: z.string().max(60).optional().or(z.literal("")),
  is_published: z.boolean().default(true),
});

export type StudyMaterialInput = z.infer<typeof materialSchema>;

export async function createStudyMaterial(input: StudyMaterialInput) {
  const { session, db } = await requireEditor();
  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { data, error } = await db
    .from("study_materials")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      file_url: parsed.data.file_url,
      file_type: parsed.data.file_type || null,
      file_size: parsed.data.file_size === "" ? null : parsed.data.file_size,
      category: parsed.data.category || null,
      is_published: parsed.data.is_published,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "study_material", data.id, { title: parsed.data.title });
  await revalidateContent(["/study-materials"]);
  return { id: data.id };
}

export async function updateStudyMaterial(id: string, input: StudyMaterialInput) {
  const { session, db } = await requireEditor();
  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { data, error } = await db
    .from("study_materials")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      file_url: parsed.data.file_url,
      file_type: parsed.data.file_type || null,
      file_size: parsed.data.file_size === "" ? null : parsed.data.file_size,
      category: parsed.data.category || null,
      is_published: parsed.data.is_published,
    })
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "study_material", id, { title: parsed.data.title });
  await revalidateContent(["/study-materials"]);
  return { id: data.id };
}

export async function deleteStudyMaterial(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("study_materials").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "study_material", id);
  await revalidateContent(["/study-materials"]);
  return { ok: true };
}

export async function toggleStudyMaterial(id: string, is_published: boolean) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("study_materials").update({ is_published }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "study_material", id, { is_published });
  await revalidateContent(["/study-materials"]);
  return { ok: true };
}
