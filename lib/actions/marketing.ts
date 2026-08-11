"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/actions/admin/helpers";
import { sendEmail, sendBulkEmail, isEmailConfigured } from "@/lib/email";
import { marketingEmail, testEmail } from "@/lib/email/templates";
import { SITE } from "@/lib/constants";

const emailSchema = z.string().email().max(320).toLowerCase();

/* ── Public: subscribe to the newsletter ──────────────────────────────── */

export async function subscribeNewsletter(input: { email: string; name?: string }) {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return { error: "Enter a valid email address." };
  const email = parsed.data;

  try {
    const db = createAdminClient();
    const { data } = await db
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();
    if (data) {
      if (data.status === "unsubscribed") {
        await db.from("newsletter_subscribers").update({ status: "subscribed" }).eq("id", data.id);
      }
    } else {
      await db.from("newsletter_subscribers").insert({
        email,
        name: input.name?.trim() || null,
        source: "website",
        status: "subscribed",
      });
    }
    return { ok: true };
  } catch {
    return { ok: true }; // never leak errors to the visitor
  }
}

/* ── Public: unsubscribe via token ────────────────────────────────────── */

export async function unsubscribeByToken(token: string) {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("newsletter_subscribers")
      .select("id")
      .eq("unsub_token", token)
      .maybeSingle();
    if (data) {
      await db.from("newsletter_subscribers").update({ status: "unsubscribed" }).eq("id", data.id);
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

/* ── Admin: subscriber management ─────────────────────────────────────── */

export async function addSubscriber(input: { email: string; name?: string }) {
  const { db } = await requireStaff();
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return { error: "Invalid email" };
  const { error } = await db.from("newsletter_subscribers").insert({
    email: parsed.data,
    name: input.name?.trim() || null,
    source: "admin",
    status: "subscribed",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/marketing");
  return { ok: true };
}

export async function removeSubscriber(id: string) {
  const { db } = await requireStaff();
  const { error } = await db.from("newsletter_subscribers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/marketing");
  return { ok: true };
}

/* ── Admin: SMTP test ─────────────────────────────────────────────────── */

export async function sendSmtpTest() {
  const { session } = await requireStaff();
  const to = session.user.email;
  if (!to) return { error: "Your account has no email address." };
  if (!(await isEmailConfigured())) {
    return {
      error:
        "SMTP is not configured. Add your SMTP credentials in Admin → Settings → Email to enable sending.",
    };
  }
  try {
    await sendEmail({
      to,
      subject: "Marwat Tech — SMTP test",
      html: testEmail(),
    });
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/* ── Admin: send a marketing campaign ─────────────────────────────────── */

const campaignSchema = z.object({
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(1).max(100_000),
  audience: z.enum(["subscribers", "clients", "custom"]),
  customEmails: z.array(z.string().email().max(320)).max(500),
});

export async function sendCampaign(input: z.infer<typeof campaignSchema>) {
  const { session, db } = await requireStaff();
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the campaign details." };

  if (!(await isEmailConfigured())) {
    return {
      error:
        "Email is not configured yet. Add your SMTP credentials (Admin → Settings → Email) before sending campaigns.",
    };
  }

  const { subject, bodyHtml, audience, customEmails } = parsed.data;

  // Resolve recipient list.
  let recipients: { email: string; name?: string | null }[] = [];
  try {
    if (audience === "subscribers") {
      const { data } = await db
        .from("newsletter_subscribers")
        .select("email, name")
        .eq("status", "subscribed");
      recipients = (data ?? []).map((r) => ({ email: r.email, name: r.name }));
    } else if (audience === "clients") {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name")
        .eq("role", "client");
      // Emails live on auth.users (not profiles) — resolve via the admin API.
      const { data: users } = await createAdminClient().auth.admin.listUsers();
      const emailById = new Map((users?.users ?? []).map((u) => [u.id, u.email]));
      recipients = (profiles ?? [])
        .map((p) => ({ email: emailById.get(p.id) ?? "", name: p.full_name }))
        .filter((r) => r.email);
    } else {
      recipients = customEmails.map((email) => ({ email }));
    }
  } catch {
    recipients = [];
  }

  // Dedupe + normalize.
  const seen = new Set<string>();
  recipients = recipients.filter((r) => {
    const e = r.email.toLowerCase();
    if (seen.has(e)) return false;
    seen.add(e);
    return true;
  });

  if (recipients.length === 0) {
    return { error: "No recipients in this audience." };
  }

  // Create campaign row.
  const { data: campaign, error: campErr } = await db
    .from("email_campaigns")
    .insert({
      subject,
      body_html: bodyHtml,
      audience,
      custom_emails: audience === "custom" ? customEmails : [],
      status: "sending",
      recipients_count: recipients.length,
      created_by: session.user.id,
    })
    .select("id")
    .single();
  if (campErr || !campaign) return { error: "Could not create campaign." };

  // Insert recipients rows.
  await db.from("campaign_recipients").insert(
    recipients.map((r) => ({ campaign_id: campaign.id, email: r.email }))
  );

  // Send (sequential, best-effort per recipient).
  let sent = 0;
  let failed = 0;
  const results = await sendBulkEmail(
    { subject, html: bodyHtml },
    recipients.map((r) => r.email)
  );
  for (const res of results) {
    if (res.ok) {
      sent++;
      await db
        .from("campaign_recipients")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("campaign_id", campaign.id)
        .eq("email", res.email);
    } else {
      failed++;
      await db
        .from("campaign_recipients")
        .update({ status: "failed", error: res.error?.slice(0, 300) })
        .eq("campaign_id", campaign.id)
        .eq("email", res.email);
    }
  }

  await db
    .from("email_campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_count: sent,
      failed_count: failed,
    })
    .eq("id", campaign.id);

  revalidatePath("/admin/marketing");
  return { ok: true, sent, failed };
}

/** Preview the branded marketing email shell (used in the composer). */
export async function previewMarketingEmail(input: { subject: string; bodyHtml: string }) {
  await requireStaff();
  return {
    html: marketingEmail({
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      unsubscribeUrl: `${SITE.url.replace(/\/$/, "")}/unsubscribe?token=preview`,
    }),
  };
}
