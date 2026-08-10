"use server";

import { z } from "zod";
import {
  requireEditor,
  logActivity,
  revalidateContent,
} from "@/lib/actions/admin/helpers";

const schema = z.object({
  client_name: z.string().min(2, "Client name is required").max(150),
  company: z.string().max(150).optional().or(z.literal("")),
  role: z.string().max(120).optional().or(z.literal("")),
  quote: z.string().min(5, "Quote is required").max(2000),
  rating: z.coerce.number().min(1).max(5).default(5),
  avatar_url: z.string().max(600).optional().or(z.literal("")),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  sort_order: z.coerce.number().default(0),
});

export type TestimonialInput = z.infer<typeof schema>;

export async function createTestimonial(input: TestimonialInput) {
  const { session, db } = await requireEditor();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { data, error } = await db
    .from("testimonials")
    .insert({ ...parsed.data, company: parsed.data.company || null, role: parsed.data.role || null, avatar_url: parsed.data.avatar_url || null })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await logActivity(db, session, "create", "testimonial", data.id, { name: parsed.data.client_name });
  await revalidateContent(["/testimonials", "/"]);
  return { id: data.id };
}

export async function updateTestimonial(id: string, input: TestimonialInput) {
  const { session, db } = await requireEditor();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { error } = await db
    .from("testimonials")
    .update({ ...parsed.data, company: parsed.data.company || null, role: parsed.data.role || null, avatar_url: parsed.data.avatar_url || null })
    .eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "update", "testimonial", id);
  await revalidateContent(["/testimonials", "/"]);
  return { ok: true };
}

export async function deleteTestimonial(id: string) {
  const { session, db } = await requireEditor();
  const { error } = await db.from("testimonials").delete().eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "delete", "testimonial", id);
  await revalidateContent(["/testimonials", "/"]);
  return { ok: true };
}

export async function toggleTestimonialStatus(id: string, status: "draft" | "published" | "archived") {
  const { session, db } = await requireEditor();
  const { error } = await db.from("testimonials").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  await logActivity(db, session, "status_change", "testimonial", id, { status });
  await revalidateContent(["/testimonials", "/"]);
  return { ok: true };
}
