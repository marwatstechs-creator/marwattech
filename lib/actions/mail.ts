"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff, requireSuperAdmin, logActivity } from "@/lib/actions/admin/helpers";
import { resolveMailConfig } from "@/lib/email";

export async function getMailSettings() {
  await requireStaff();
  const cfg = await resolveMailConfig();
  let stored: {
    host: string | null;
    port: number | null;
    secure: boolean;
    user: string | null;
    hasPass: boolean;
    from_email: string | null;
  } | null = null;
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("mail_settings")
      .select("host, port, secure, user, pass, from_email")
      .eq("id", true)
      .maybeSingle();
    stored = data
      ? {
          host: data.host,
          port: data.port,
          secure: data.secure,
          user: data.user,
          hasPass: Boolean(data.pass),
          from_email: data.from_email,
        }
      : null;
  } catch {
    stored = null;
  }
  return { configured: cfg.configured, provider: cfg.provider, fromEmail: cfg.fromEmail, stored };
}

const mailSchema = z.object({
  host: z.string().max(300).optional().or(z.literal("")),
  port: z.coerce.number().int().min(1).max(65535).optional().or(z.literal(0)),
  secure: z.boolean().optional(),
  user: z.string().max(300).optional().or(z.literal("")),
  pass: z.string().max(300).optional().or(z.literal("")),
  clearPass: z.boolean().optional(),
  fromEmail: z.string().max(300).optional().or(z.literal("")),
});

export async function saveMailSettings(input: z.infer<typeof mailSchema>) {
  const { session, db } = await requireSuperAdmin();
  const parsed = mailSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid mail settings." };

  const patch: {
    host?: string | null;
    port?: number | null;
    secure?: boolean;
    user?: string | null;
    pass?: string | null;
    from_email?: string | null;
  } = {};
  if (parsed.data.host) patch.host = parsed.data.host.trim();
  if (parsed.data.port && parsed.data.port > 0) patch.port = parsed.data.port;
  if (typeof parsed.data.secure === "boolean") patch.secure = parsed.data.secure;
  if (parsed.data.user) patch.user = parsed.data.user.trim();
  if (parsed.data.clearPass) patch.pass = null;
  else if (parsed.data.pass) patch.pass = parsed.data.pass.trim();
  if (parsed.data.fromEmail) patch.from_email = parsed.data.fromEmail.trim();

  const { error } = await db.from("mail_settings").update(patch).eq("id", true);
  if (error) return { error: error.message };

  await logActivity(db, session, "mail_settings_update", "mail_settings", "smtp", {
    has_host: Boolean(patch.host),
    has_user: Boolean(patch.user),
    has_pass: Boolean(patch.pass),
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/marketing");
  return { ok: true };
}
