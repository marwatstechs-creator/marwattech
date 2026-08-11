/**
 * Branded HTML email templates — follow the Marwat Tech web app style:
 * purple (primary) + gold (accent) + white, Inter font, rounded cards.
 * All inline styles (email-client safe). Server-only.
 */
import { SITE } from "@/lib/constants";

/* ── Brand tokens (mirror app/globals.css) ───────────────────────────── */
const PURPLE = "#7464c6";
const PURPLE_DARK = "#5f4fa8";
const GOLD = "#f8c640";
const AZURE = "#5f4fa8";
const INK = "#1e293b";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG = "#f4f5f7";
const CARD = "#ffffff";

export function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type LayoutOpts = {
  preheader?: string;
  title?: string;
  badge?: string;
  body: string;
  cta?: { label: string; href: string };
  unsubscribeUrl?: string;
  recipientEmail?: string;
};

/** Shared branded shell used by every template. */
export function emailLayout(o: LayoutOpts): string {
  const siteUrl = SITE.url.replace(/\/$/, "");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>${esc(o.title ?? SITE.name)}</title>
${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(o.preheader)}</div>` : ""}
</head>
<body style="margin:0;padding:0;background:${BG};font-family:Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <!-- Outer -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${CARD};border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_DARK} 100%);padding:26px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">MARWAT <span style="color:${GOLD};">TECH</span></div>
                  <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:2px;">${esc(SITE.description)}</div>
                </td>
                <td align="right" valign="top" style="white-space:nowrap;">
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td style="width:8px;height:8px;background:${GOLD};border-radius:50%;"></td>
                    <td style="width:6px;"></td>
                    <td style="width:8px;height:8px;background:#ffffff;border-radius:50%;"></td>
                    <td style="width:6px;"></td>
                    <td style="width:8px;height:8px;background:${AZURE};border-radius:50%;"></td>
                  </tr></table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Gold accent strip -->
        <tr><td style="height:4px;background:${GOLD};"></td></tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${o.badge ? `<div style="display:inline-block;background:${PURPLE}14;color:${PURPLE};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:999px;margin-bottom:14px;">${esc(o.badge)}</div>` : ""}
            ${o.title ? `<h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:${INK};font-weight:800;">${esc(o.title)}</h1>` : ""}
            ${o.body}
            ${o.cta ? ctaButton(o.cta.label, o.cta.href) : ""}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${BG};border-top:1px solid ${BORDER};padding:24px 32px;">
            <div style="font-size:12px;color:${MUTED};line-height:1.7;">
              <strong style="color:${INK};">${esc(SITE.legalName ?? SITE.name)}</strong><br/>
              ${esc(SITE.location)} · <a href="tel:${esc(SITE.phone.replace(/\s/g, ""))}" style="color:${AZURE};text-decoration:none;">${esc(SITE.phone)}</a><br/>
              <a href="mailto:${esc(SITE.email)}" style="color:${AZURE};text-decoration:none;">${esc(SITE.email)}</a> ·
              <a href="${siteUrl}" style="color:${AZURE};text-decoration:none;">${siteUrl.replace(/^https?:\/\//, "")}</a><br/>
              ${SITE.social.facebook ? `<a href="${esc(SITE.social.facebook)}" style="color:${AZURE};text-decoration:none;">Facebook</a>` : ""}
              ${SITE.social.linkedin ? ` · <a href="${esc(SITE.social.linkedin)}" style="color:${AZURE};text-decoration:none;">LinkedIn</a>` : ""}
              ${SITE.social.instagram ? ` · <a href="${esc(SITE.social.instagram)}" style="color:${AZURE};text-decoration:none;">Instagram</a>` : ""}
              ${SITE.social.youtube ? ` · <a href="${esc(SITE.social.youtube)}" style="color:${AZURE};text-decoration:none;">YouTube</a>` : ""}
              <br/><br/>
              © ${new Date().getFullYear()} ${esc(SITE.legalName ?? SITE.name)}. All rights reserved.<br/>
              ${o.unsubscribeUrl ? `<a href="${esc(o.unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline;">Unsubscribe from marketing emails</a>` : "This is a transactional email about your account."}
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;"><tr>
    <td style="border-radius:999px;background:${PURPLE};">
      <a href="${esc(href)}" style="display:inline-block;padding:12px 26px;border-radius:999px;background:${PURPLE};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">${esc(label)}</a>
    </td>
  </tr></table>`;
}

/* ── Templates ───────────────────────────────────────────────────────── */

export function marketingEmail(opts: {
  subject: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  unsubscribeUrl?: string;
}): string {
  return emailLayout({
    preheader: opts.subject,
    title: opts.subject,
    body: opts.bodyHtml,
    cta: opts.cta,
    unsubscribeUrl: opts.unsubscribeUrl,
  });
}

export function paymentReceiptEmail(opts: {
  orderId: string;
  amount: string;
  currency: string;
  itemName?: string | null;
  customerName?: string | null;
  payerEmail?: string | null;
  date: string;
}): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:13px;">${label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid ${BORDER};color:${INK};font-size:13px;font-weight:600;text-align:right;">${value}</td>
    </tr>`;
  return emailLayout({
    badge: "Receipt",
    title: "Payment received",
    preheader: `Your payment of ${opts.amount} ${opts.currency} was received.`,
    body: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${MUTED};">Thank you${opts.customerName ? `, ${esc(opts.customerName)}` : ""}! We've recorded your payment successfully.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden;margin:0 0 8px;">
        ${row("Order reference", esc(opts.orderId))}
        ${row("Amount paid", `${esc(opts.amount)} ${esc(opts.currency)}`)}
        ${opts.itemName ? row("For", esc(opts.itemName)) : ""}
        ${opts.payerEmail ? row("Paid via", esc(opts.payerEmail)) : ""}
        ${row("Date", esc(opts.date))}
      </table>
      <p style="margin:12px 0 0;font-size:12px;color:${MUTED};">Questions about this payment? Reply to this email or contact us at <a href="mailto:${esc(SITE.supportEmail)}" style="color:${AZURE};">${esc(SITE.supportEmail)}</a>.</p>
    `,
    cta: { label: "View your order", href: `${SITE.url.replace(/\/$/, "")}/payment` },
  });
}

export function invoiceEmail(opts: {
  invoiceNumber: string;
  clientName?: string | null;
  amount: string;
  currency: string;
  dueDate?: string | null;
  description?: string | null;
}): string {
  return emailLayout({
    badge: "Invoice",
    title: `Invoice ${opts.invoiceNumber}`,
    preheader: `You have an invoice for ${opts.amount} ${opts.currency}.`,
    body: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${MUTED};">Hi${opts.clientName ? ` ${esc(opts.clientName)}` : ""}, an invoice has been issued${opts.dueDate ? ` and is due on ${esc(opts.dueDate)}` : ""}. Please review the details below.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden;margin:0 0 8px;">
        <tr>
          <td style="padding:14px 16px;background:${BG};">
            <div style="font-size:12px;color:${MUTED};">Invoice number</div>
            <div style="font-size:15px;font-weight:800;color:${INK};">${esc(opts.invoiceNumber)}</div>
          </td>
          <td style="padding:14px 16px;background:${BG};text-align:right;">
            <div style="font-size:12px;color:${MUTED};">Amount due</div>
            <div style="font-size:18px;font-weight:800;color:${PURPLE};">${esc(opts.amount)} ${esc(opts.currency)}</div>
          </td>
        </tr>
        ${opts.description ? `<tr><td colspan="2" style="padding:12px 16px;color:${MUTED};font-size:13px;">${esc(opts.description)}</td></tr>` : ""}
      </table>
    `,
    cta: { label: "Pay this invoice", href: `${SITE.url.replace(/\/$/, "")}/payment` },
  });
}

export function welcomeEmail(opts: { name?: string | null; loginUrl: string }): string {
  return emailLayout({
    badge: "Welcome",
    title: `Welcome to ${SITE.name}`,
    preheader: "Your account is ready.",
    body: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${MUTED};">Hi${opts.name ? ` ${esc(opts.name)}` : ""}, your account is ready. Log in to manage your projects, payments, support tickets and more.</p>
    `,
    cta: { label: "Log in to your account", href: opts.loginUrl },
  });
}

export function subscriptionConfirmationEmail(opts: {
  planName: string;
  amount: string;
  currency: string;
  interval: string;
}): string {
  return emailLayout({
    badge: "Subscription",
    title: `You're subscribed to ${opts.planName}`,
    preheader: `Your ${opts.planName} subscription is active (${opts.amount} ${opts.currency}/${opts.interval}).`,
    body: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${MUTED};">Your recurring subscription is now active.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden;margin:0 0 8px;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:13px;">Plan</td><td style="padding:12px 16px;font-weight:600;text-align:right;">${esc(opts.planName)}</td></tr>
        <tr><td style="padding:12px 16px;color:${MUTED};font-size:13px;">Billing</td><td style="padding:12px 16px;font-weight:600;text-align:right;">${esc(opts.amount)} ${esc(opts.currency)} / ${esc(opts.interval)}</td></tr>
      </table>
    `,
    cta: { label: "Manage subscription", href: `${SITE.url.replace(/\/$/, "")}/client` },
  });
}

export function payoutNoticeEmail(opts: {
  recipientEmail: string;
  amount: string;
  currency: string;
  note?: string | null;
}): string {
  return emailLayout({
    badge: "Payout",
    title: "You received a payout",
    preheader: `A payout of ${opts.amount} ${opts.currency} was sent to you.`,
    body: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${MUTED};">A payment of <strong style="color:${INK};">${esc(opts.amount)} ${esc(opts.currency)}</strong> has been sent to ${esc(opts.recipientEmail)} from ${SITE.name}.</p>
      ${opts.note ? `<p style="background:${BG};padding:12px;border-radius:8px;font-size:13px;color:${INK};">${esc(opts.note)}</p>` : ""}
    `,
  });
}

export function testEmail(): string {
  return emailLayout({
    badge: "Test",
    title: "SMTP test — it works!",
    preheader: "SMTP configuration verified.",
    body: `
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${MUTED};">This email confirms your SMTP mail system is configured and sending correctly.</p>
      <p style="margin:0;font-size:13px;color:${INK};font-weight:600;">Sent at ${new Date().toUTCString()}</p>
    `,
  });
}
