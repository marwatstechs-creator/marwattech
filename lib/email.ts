import nodemailer from "nodemailer";
import { SITE } from "@/lib/constants";

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

const recipients = (to: string | string[]) =>
  (Array.isArray(to) ? to : [to]).join(", ");

/* ── Effective mail config: env vars first, then the DB override ──────── */

export type MailConfig = {
  provider: "smtp" | "resend";
  configured: boolean;
  host: string | null;
  port: number;
  secure: boolean;
  user: string | null;
  pass: string | null;
  fromEmail: string | null;
};

let cachedMailConfig: { at: number; cfg: MailConfig } | null = null;

/** Resolve effective SMTP/Resend settings (env OR Admin → Settings → Email). */
export async function resolveMailConfig(): Promise<MailConfig> {
  const resendKey = process.env.RESEND_API_KEY;
  const envHost = process.env.SMTP_HOST || null;
  const envUser = process.env.SMTP_USER || null;
  const envPass = process.env.SMTP_PASS || null;

  if (resendKey || (envHost && envUser && envPass)) {
    return {
      provider: resendKey ? "resend" : "smtp",
      configured: true,
      host: envHost,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: process.env.SMTP_SECURE !== "false",
      user: envUser,
      pass: envPass,
      fromEmail: process.env.SMTP_FROM_EMAIL || null,
    };
  }

  // Try the DB override (staff-editable from Settings).
  const cacheMs = 10_000;
  if (cachedMailConfig && Date.now() - cachedMailConfig.at < cacheMs) {
    return cachedMailConfig.cfg;
  }
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const db = createAdminClient();
    const { data } = await db
      .from("mail_settings")
      .select("host, port, secure, user, pass, from_email")
      .eq("id", true)
      .maybeSingle();
    if (data?.host && data.user && data.pass) {
      const cfg: MailConfig = {
        provider: "smtp",
        configured: true,
        host: data.host,
        port: data.port ?? 465,
        secure: data.secure,
        user: data.user,
        pass: data.pass,
        fromEmail: data.from_email || null,
      };
      cachedMailConfig = { at: Date.now(), cfg };
      return cfg;
    }
  } catch {
    // DB unreachable — fall through to not-configured.
  }
  return {
    provider: "smtp",
    configured: false,
    host: envHost,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    user: envUser,
    pass: envPass,
    fromEmail: null,
  };
}

/** True when either SMTP or Resend credentials are available. */
export async function isEmailConfigured(): Promise<boolean> {
  return (await resolveMailConfig()).configured;
}

/** Resend HTTP API — edge friendly, use as an alternative to SMTP. */
async function sendViaResend(payload: EmailPayload) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.from ?? `Marwat Tech <onboarding@resend.dev>`,
      to: recipients(payload.to),
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

/** SMTP via cPanel mail server (Node runtime — used by email route). */
async function sendViaSmtp(payload: EmailPayload, cfg: MailConfig) {
  const { host, port, secure, user, pass } = cfg;
  if (!host || !user || !pass) {
    throw new Error("SMTP credentials are required.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const from = payload.from ?? cfg.fromEmail ?? `"${SITE.name}" <${user}>`;

  await transporter.sendMail({
    from,
    to: recipients(payload.to),
    replyTo: payload.replyTo,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

export async function sendEmail(payload: EmailPayload) {
  const cfg = await resolveMailConfig();
  if (cfg.provider === "resend") {
    await sendViaResend(payload);
    return;
  }
  await sendViaSmtp(payload, cfg);
}

/**
 * Send to many recipients independently — one failure never blocks the rest.
 * Returns per-recipient results for campaign tracking.
 */
export async function sendBulkEmail(
  payload: Omit<EmailPayload, "to">,
  recipientsList: string[]
): Promise<{ email: string; ok: boolean; error?: string }[]> {
  const results: { email: string; ok: boolean; error?: string }[] = [];
  for (const email of recipientsList) {
    try {
      await sendEmail({ ...payload, to: email });
      results.push({ email, ok: true });
    } catch (err) {
      results.push({
        email,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

/* ── Notification templates ─────────────────────────────────────────── */

function shell(body: string) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
    <div style="background:#7464c6;padding:20px 28px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;color:#fff;font-size:20px;">${SITE.name}</h1>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:0;padding:28px;border-radius:0 0 12px 12px;">
      ${body}
      <p style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;">
        This is an automated notification from ${SITE.name}.
      </p>
    </div>
  </div>`;
}

function field(label: string, value: string) {
  return `<p style="margin:6px 0;"><strong>${label}:</strong> ${value}</p>`;
}

export async function notifyContact(form: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  service?: string | null;
  message: string;
}, to: string) {
  const html = shell(`
    <h2 style="margin-top:0;">📩 New contact message</h2>
    ${field("Name", form.name)}
    ${field("Email", form.email)}
    ${form.phone ? field("Phone", form.phone) : ""}
    ${form.subject ? field("Subject", form.subject) : ""}
    ${form.service ? field("Service", form.service) : ""}
    <p style="margin:16px 0 6px;"><strong>Message:</strong></p>
    <p style="background:#f8fafc;padding:12px;border-radius:8px;white-space:pre-wrap;">${form.message}</p>
  `);
  await sendEmail({
    to,
    subject: `New contact message from ${form.name}`,
    html,
    replyTo: form.email,
  });
}

export async function notifySupport(ticket: {
  name: string;
  email: string;
  issue_type: string;
  priority: string;
  subject?: string | null;
  message: string;
}, to: string) {
  const html = shell(`
    <h2 style="margin-top:0;">🛠️ New support ticket</h2>
    ${field("Name", ticket.name)}
    ${field("Email", ticket.email)}
    ${field("Issue type", ticket.issue_type)}
    ${field("Priority", ticket.priority)}
    ${ticket.subject ? field("Subject", ticket.subject) : ""}
    <p style="margin:16px 0 6px;"><strong>Message:</strong></p>
    <p style="background:#f8fafc;padding:12px;border-radius:8px;white-space:pre-wrap;">${ticket.message}</p>
  `);
  await sendEmail({
    to,
    subject: `[${ticket.priority.toUpperCase()}] Support ticket from ${ticket.name}`,
    html,
    replyTo: ticket.email,
  });
}

export async function notifyMockup(req: {
  name: string;
  email: string;
  phone?: string | null;
  website_type: string;
  budget_range?: string | null;
  description: string;
}, to: string) {
  const html = shell(`
    <h2 style="margin-top:0;">🎨 New free mockup request</h2>
    ${field("Name", req.name)}
    ${field("Email", req.email)}
    ${req.phone ? field("Phone", req.phone) : ""}
    ${field("Website type", req.website_type)}
    ${req.budget_range ? field("Budget range", req.budget_range) : ""}
    <p style="margin:16px 0 6px;"><strong>Project description:</strong></p>
    <p style="background:#f8fafc;padding:12px;border-radius:8px;white-space:pre-wrap;">${req.description}</p>
  `);
  await sendEmail({
    to,
    subject: `Free mockup request from ${req.name}`,
    html,
    replyTo: req.email,
  });
}

export async function notifyApplication(app: {
  applicant_name: string;
  email: string;
  phone?: string | null;
  career_title: string;
  cover_letter?: string | null;
}, to: string) {
  const html = shell(`
    <h2 style="margin-top:0;">🧑‍💼 New job application</h2>
    ${field("Applicant", app.applicant_name)}
    ${field("Email", app.email)}
    ${app.phone ? field("Phone", app.phone) : ""}
    ${field("Position", app.career_title)}
    ${app.cover_letter ? `<p style="margin:16px 0 6px;"><strong>Cover letter:</strong></p><p style="background:#f8fafc;padding:12px;border-radius:8px;white-space:pre-wrap;">${app.cover_letter}</p>` : ""}
  `);
  await sendEmail({
    to,
    subject: `Job application for ${app.career_title} — ${app.applicant_name}`,
    html,
    replyTo: app.email,
  });
}
