import nodemailer from "nodemailer";
import { SITE } from "@/lib/constants";
import {
  emailLayout,
  infoCard,
  quoteRequestEmail,
  esc,
  PURPLE,
  INK,
  MUTED,
  BORDER,
  BG,
} from "@/lib/email/templates";

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

/* ── Notification templates (branded — match the web app) ───────────── */

/** Shared branded wrapper for the internal notification emails. */
function notifyShell(o: { badge: string; title: string; body: string; preheader?: string }): string {
  return emailLayout({ badge: o.badge, title: o.title, preheader: o.preheader, body: o.body });
}

/** Message callout box used inside notifications. */
function messageBox(text: string): string {
  return `<div style="background:${BG};border:1px solid ${BORDER};border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.6;color:${INK};white-space:pre-wrap;">${esc(text)}</div>`;
}

export async function notifyContact(form: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  service?: string | null;
  message: string;
}, to: string) {
  const html = notifyShell({
    badge: "New enquiry",
    title: "📩 New contact message",
    preheader: `Contact message from ${form.name}`,
    body: `
      <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:${MUTED};">A new enquiry came in through the website. Reply directly to <a href="mailto:${esc(form.email)}" style="color:${PURPLE};font-weight:700;">${esc(form.email)}</a>.</p>
      ${infoCard({ rows: [
        { label: "Name", value: esc(form.name) },
        { label: "Email", value: esc(form.email) },
        ...(form.phone ? [{ label: "Phone", value: esc(form.phone) }] : []),
        ...(form.subject ? [{ label: "Subject", value: esc(form.subject) }] : []),
        ...(form.service ? [{ label: "Service", value: esc(form.service) }] : []),
      ]})}
      ${messageBox(form.message)}
    `,
  });
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
  const html = notifyShell({
    badge: "Support ticket",
    title: "🛠️ New support ticket",
    preheader: `[${ticket.priority.toUpperCase()}] Ticket from ${ticket.name}`,
    body: `
      <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:${MUTED};">A new support ticket was opened by <a href="mailto:${esc(ticket.email)}" style="color:${PURPLE};font-weight:700;">${esc(ticket.email)}</a>.</p>
      ${infoCard({ rows: [
        { label: "Name", value: esc(ticket.name) },
        { label: "Email", value: esc(ticket.email) },
        { label: "Issue type", value: esc(ticket.issue_type) },
        { label: "Priority", value: esc(ticket.priority) },
        ...(ticket.subject ? [{ label: "Subject", value: esc(ticket.subject) }] : []),
      ]})}
      ${messageBox(ticket.message)}
    `,
  });
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
  const html = notifyShell({
    badge: "Free mockup",
    title: "🎨 New free mockup request",
    preheader: `Mockup request from ${req.name}`,
    body: `
      <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:${MUTED};">A new free mockup request came in from <a href="mailto:${esc(req.email)}" style="color:${PURPLE};font-weight:700;">${esc(req.email)}</a>.</p>
      ${infoCard({ rows: [
        { label: "Name", value: esc(req.name) },
        { label: "Email", value: esc(req.email) },
        ...(req.phone ? [{ label: "Phone", value: esc(req.phone) }] : []),
        { label: "Website type", value: esc(req.website_type) },
        ...(req.budget_range ? [{ label: "Budget range", value: esc(req.budget_range) }] : []),
      ]})}
      ${messageBox(req.description)}
    `,
  });
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
  const html = notifyShell({
    badge: "Job application",
    title: "🧑‍💼 New job application",
    preheader: `Application for ${app.career_title} — ${app.applicant_name}`,
    body: `
      <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:${MUTED};">A new job application was submitted by <a href="mailto:${esc(app.email)}" style="color:${PURPLE};font-weight:700;">${esc(app.email)}</a>.</p>
      ${infoCard({ rows: [
        { label: "Applicant", value: esc(app.applicant_name) },
        { label: "Email", value: esc(app.email) },
        ...(app.phone ? [{ label: "Phone", value: esc(app.phone) }] : []),
        { label: "Position", value: esc(app.career_title) },
      ]})}
      ${app.cover_letter ? messageBox(app.cover_letter) : ""}
    `,
  });
  await sendEmail({
    to,
    subject: `Job application for ${app.career_title} — ${app.applicant_name}`,
    html,
    replyTo: app.email,
  });
}

/** Customer-facing "we received your quotation request" confirmation. */
export async function notifyQuoteReceived(
  to: string,
  opts: { name?: string | null; service?: string | null }
) {
  await sendEmail({
    to,
    subject: `Thanks${opts.name ? ` ${opts.name}` : ""} — we've received your request`,
    html: quoteRequestEmail({ name: opts.name, service: opts.service }),
  });
}
