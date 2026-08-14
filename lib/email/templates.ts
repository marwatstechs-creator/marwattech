/**
 * Branded HTML email templates — iOS-27-inspired "liquid glass" style.
 * Purple (primary) + gold (accent) + white, Inter, large squircle cards
 * with soft layered shadows, a mobile-responsive shell and the real navbar
 * logo in the header.
 *
 * Icons: we use emoji inside iOS-style squircle tiles instead of a Lucide
 * SVG sprite, because email clients (Gmail, Outlook, Apple Mail) strip
 * <svg>/icon libraries — emoji render on every device.
 *
 * All inline styles (email-client safe) + a small <style> block for
 * mobile media queries (Apple Mail / most mobile clients). Server-only.
 */
import { SITE } from "@/lib/constants";

/* ── Brand tokens (mirror app/globals.css) ───────────────────────────── */
export const PURPLE = "#7464c6";
export const PURPLE_DARK = "#5f4fa8";
const PURPLE_DEEP = "#4b3ea1";
const PURPLE_SOFT = "#8b7dd4";
export const GOLD = "#f8c640";
const GOLD_DARK = "#e0a51e";
export const AZURE = "#5f4fa8";
export const INK = "#101828";
export const MUTED = "#667085";
export const BORDER = "#eae7f6";
export const BG = "#f3f2fa";
export const CARD = "#ffffff";
const RADIUS = 26;
const SHADOW =
  "0 1px 2px rgba(16,24,40,0.05), 0 10px 34px rgba(75,62,161,0.13)";

export function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** iOS-style squircle logo tile (the real navbar mobile logo, rasterized PNG). */
function logoMark(): string {
  const logoUrl = `${SITE.url.replace(/\/$/, "")}/assets/logo-square.png`;
  return `
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="border-radius:16px;background:#ffffff;border:1px solid rgba(255,255,255,0.85);box-shadow:0 4px 14px rgba(43,34,94,0.35);padding:3px;">
      <img src="${esc(logoUrl)}" width="42" height="42" alt="${esc(SITE.name)}" style="display:block;width:42px;height:42px;border-radius:12px;" />
    </td>
  </tr></table>`;
}

/** Brand dots — gold / white / soft white (mirrors the web hero). */
function brandDots(): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="width:9px;height:9px;background:${GOLD};border-radius:50%;"></td>
    <td style="width:6px;"></td>
    <td style="width:9px;height:9px;background:rgba(255,255,255,0.92);border-radius:50%;"></td>
    <td style="width:6px;"></td>
    <td style="width:9px;height:9px;background:rgba(255,255,255,0.5);border-radius:50%;"></td>
  </tr></table>`;
}

/** Emoji icon tile (iOS squircle) used across templates. */
function iconTile(icon: string, tint: string, size = 38): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 10px;"><tr>
    <td align="center" style="width:${size}px;height:${size}px;border-radius:12px;background:${tint};font-size:18px;line-height:${size}px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.6);">${icon}</td>
  </tr></table>`;
}

/** iOS-style "info card" — clean label/value rows with a tinted header. */
export function infoCard(opts: {
  headerLeft?: string;
  headerRight?: string;
  rows: { label: string; value: string }[];
}): string {
  const { headerLeft, headerRight, rows } = opts;
  const header =
    headerLeft || headerRight
      ? `
      <tr>
        <td colspan="2" style="padding:16px 20px;background:linear-gradient(135deg,${PURPLE_SOFT} 0%,${PURPLE_DARK} 100%);border-radius:${RADIUS - 10}px ${RADIUS - 10}px 0 0;">
          <table role="presentation" width="100%"><tr>
            <td style="color:#ffffff;font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">${headerLeft ?? ""}</td>
            <td align="right" style="color:#ffffff;font-size:16px;font-weight:800;">${headerRight ?? ""}</td>
          </tr></table>
        </td>
      </tr>`
      : "";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:${RADIUS - 8}px;overflow:hidden;margin:0 0 18px;box-shadow:0 1px 2px rgba(16,24,40,0.04),0 6px 20px rgba(75,62,161,0.08);">
    ${header}
    ${rows
      .map(
        (r, i) => `
      <tr>
        <td style="padding:13px 20px;border-bottom:${i === rows.length - 1 ? "none" : `1px solid ${BORDER}`};background:${i % 2 === 1 ? BG : "#ffffff"};color:${MUTED};font-size:13px;width:44%;vertical-align:top;">${r.label}</td>
        <td style="padding:13px 20px;border-bottom:${i === rows.length - 1 ? "none" : `1px solid ${BORDER}`};background:${i % 2 === 1 ? BG : "#ffffff"};color:${INK};font-size:13px;font-weight:700;text-align:right;vertical-align:top;">${r.value}</td>
      </tr>`
      )
      .join("")}
  </table>`;
}

/** iOS-style "how it works" — emoji squircle tiles + title + description. */
export function stepsCard(items: { icon: string; title: string; desc: string }[]): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:${RADIUS - 6}px;overflow:hidden;margin:0 0 18px;box-shadow:0 1px 2px rgba(16,24,40,0.04),0 6px 20px rgba(75,62,161,0.08);">
    <tr>
      ${items
        .map(
          (it, i) => `
        <td width="33%" style="padding:22px 12px 18px;border-right:${i === items.length - 1 ? "none" : `1px solid ${BORDER}`};vertical-align:top;text-align:center;">
          ${iconTile(it.icon, i === 1 ? `${GOLD}1f` : `${PURPLE}14`)}
          <div style="font-size:14px;font-weight:800;color:${INK};margin:0 0 5px;">${it.title}</div>
          <div style="font-size:12px;line-height:1.55;color:${MUTED};padding:0 6px;">${it.desc}</div>
        </td>`
        )
        .join("")}
    </tr>
  </table>`;
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
  const tagline =
    SITE.description.length > 64 ? SITE.description.slice(0, 64) + "…" : SITE.description;
  const socials: [string, string][] = [
    ["Facebook", SITE.social.facebook],
    ["LinkedIn", SITE.social.linkedin],
    ["Instagram", SITE.social.instagram],
    ["YouTube", SITE.social.youtube],
  ].filter(([, h]) => Boolean(h)) as [string, string][];
  const socialLinks = socials
    .map(
      ([label, href]) =>
        `<a href="${esc(href)}" style="color:${PURPLE};text-decoration:none;font-weight:700;">${label}</a>`
    )
    .join("&nbsp;&nbsp;·&nbsp;&nbsp;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>${esc(o.title ?? SITE.name)}</title>
${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(o.preheader)}</div>` : ""}
<style>
  @media only screen and (max-width:620px){
    .mt-hdr{padding:24px 22px 18px !important;}
    .mt-body{padding:28px 22px 24px !important;}
    .mt-foot{padding:22px !important;}
    .mt-title{font-size:21px !important;}
    .mt-wordmark{font-size:18px !important;}
    .mt-hide{display:none !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <!-- Outer -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 12px;">
    <tr><td align="center">
      <!-- iOS glass card -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${CARD};border-radius:${RADIUS}px;overflow:hidden;border:1px solid rgba(255,255,255,0.9);box-shadow:${SHADOW};">

        <!-- Header (liquid-glass gradient + logo nav) -->
        <tr>
          <td class="mt-hdr" style="background:linear-gradient(135deg, ${PURPLE_SOFT} 0%, ${PURPLE} 46%, ${PURPLE_DEEP} 100%);padding:32px 36px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td class="mt-hide" style="padding-right:14px;vertical-align:middle;">${logoMark()}</td>
                    <td style="vertical-align:middle;">
                      <div class="mt-wordmark" style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.5px;line-height:1.1;">MARWAT <span style="color:${GOLD};">TECH</span></div>
                      <div style="font-size:11px;color:rgba(255,255,255,0.85);margin-top:4px;letter-spacing:0.2px;">${esc(tagline)}</div>
                    </td>
                  </tr></table>
                </td>
                <td class="mt-hide" align="right" valign="middle" style="white-space:nowrap;">${brandDots()}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Gold accent strip -->
        <tr><td style="height:6px;background:linear-gradient(90deg, ${GOLD} 0%, #ffe494 50%, ${GOLD} 100%);"></td></tr>

        <!-- Body -->
        <tr>
          <td class="mt-body" style="padding:38px 38px 30px;">
            ${o.badge ? `<div style="display:inline-block;background:${PURPLE}14;color:${PURPLE_DARK};font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;padding:6px 14px;border-radius:999px;margin-bottom:18px;border:1px solid ${PURPLE}26;">${esc(o.badge)}</div>` : ""}
            ${o.title ? `<h1 class="mt-title" style="margin:0 0 16px;font-size:24px;line-height:1.25;color:${INK};font-weight:800;letter-spacing:-0.2px;">${esc(o.title)}</h1>` : ""}
            ${o.body}
            ${o.cta ? ctaButton(o.cta.label, o.cta.href) : ""}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="mt-foot" style="background:linear-gradient(180deg, #fbfaff 0%, ${BG} 100%);border-top:1px solid ${BORDER};padding:28px 36px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                  <td style="padding-right:10px;vertical-align:middle;">${logoMark()}</td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:13px;font-weight:800;color:${INK};">${esc(SITE.legalName ?? SITE.name)}</div>
                    <div style="font-size:11px;color:${MUTED};">${esc(SITE.location)}</div>
                  </td>
                </tr></table>
              </td>
            </tr></table>
            <div style="margin-top:14px;font-size:12px;color:${MUTED};line-height:1.8;">
              <div><a href="tel:${esc(SITE.phone.replace(/\s/g, ""))}" style="color:${PURPLE};text-decoration:none;font-weight:600;">${esc(SITE.phone)}</a> &nbsp;·&nbsp; <a href="mailto:${esc(SITE.email)}" style="color:${PURPLE};text-decoration:none;font-weight:600;">${esc(SITE.email)}</a></div>
              <div><a href="${siteUrl}" style="color:${PURPLE};text-decoration:none;font-weight:600;">${siteUrl.replace(/^https?:\/\//, "")}</a></div>
              <div style="margin:12px 0 2px;padding-top:14px;border-top:1px solid ${BORDER};color:${MUTED};font-size:11px;">${socialLinks}</div>
              <div style="margin-top:10px;color:${MUTED};font-size:11px;">© ${new Date().getFullYear()} ${esc(SITE.legalName ?? SITE.name)}. All rights reserved.</div>
              <div style="margin-top:4px;font-size:11px;">${o.unsubscribeUrl ? `<a href="${esc(o.unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline;">Unsubscribe from marketing emails</a>` : "This is a transactional email about your account."}</div>
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
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 4px;"><tr>
    <td align="center" style="border-radius:999px;background:linear-gradient(180deg, ${PURPLE_SOFT} 0%, ${PURPLE} 55%, ${PURPLE_DEEP} 100%);box-shadow:0 8px 20px rgba(88,74,176,0.42), inset 0 1px 0 rgba(255,255,255,0.3);">
      <a href="${esc(href)}" style="display:inline-block;padding:14px 32px;border-radius:999px;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;letter-spacing:0.3px;">${esc(label)}&nbsp;&nbsp;→</a>
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

/** Course Update digest email — lists each updated course with "What's new". */
export function courseUpdateEmail(opts: {
  courses: { title: string; summaryPoints: string[]; url: string }[];
  recipientEmail: string;
  unsubscribeUrl: string;
}): string {
  const count = opts.courses.length;
  const cards = opts.courses
    .map(
      (c) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:${RADIUS - 6}px;overflow:hidden;margin:0 0 20px;box-shadow:0 1px 2px rgba(16,24,40,0.04),0 6px 20px rgba(75,62,161,0.08);">
      <tr>
        <td style="padding:16px 20px;background:linear-gradient(135deg, ${PURPLE}12 0%, ${GOLD}1c 100%);border-bottom:1px solid ${BORDER};">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px;vertical-align:middle;">${iconTile("📚", `${PURPLE}18`, 34)}</td>
            <td style="vertical-align:middle;">
              <div style="font-size:15px;font-weight:800;color:${INK};line-height:1.35;">${esc(c.title)}</div>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 20px 6px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:${PURPLE};margin-bottom:9px;">✦ What's new</div>
          <ul style="margin:0;padding-left:20px;">
            ${c.summaryPoints
              .map(
                (p) =>
                  `<li style="font-size:13px;line-height:1.7;color:${MUTED};margin-bottom:6px;">${esc(p)}</li>`
              )
              .join("")}
          </ul>
        </td>
      </tr>
      <tr>
        <td style="padding:4px 20px 20px;">${ctaButton("View Course", c.url)}</td>
      </tr>
    </table>`
    )
    .join("");

  return emailLayout({
    preheader: `${count} course${count > 1 ? "s" : ""} you follow ${count > 1 ? "have" : "has"} been updated.`,
    badge: "Course Update",
    title:
      count > 1
        ? "Your courses have been updated — check out what's new"
        : "Your course has been updated — check out what's new",
    body: `
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">Hi there, a course you're following has new updates. Here's what changed:</p>
      ${cards}
      <p style="margin:12px 0 0;font-size:12px;line-height:1.65;color:${MUTED};">You're receiving this email because you subscribed to <strong>course update notifications</strong> from ${esc(SITE.name)}. We only send useful course-update digests — never spam.</p>
    `,
    unsubscribeUrl: opts.unsubscribeUrl,
    recipientEmail: opts.recipientEmail,
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
  return emailLayout({
    badge: "Receipt",
    title: "Payment received 🎉",
    preheader: `Your payment of ${opts.amount} ${opts.currency} was received.`,
    body: `
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">Thank you${opts.customerName ? `, ${esc(opts.customerName)}` : ""}! We've recorded your payment successfully — a copy of your receipt is below.</p>
      ${infoCard({
        headerLeft: `Receipt · ${esc(opts.orderId)}`,
        headerRight: `${esc(opts.amount)} ${esc(opts.currency)}`,
        rows: [
          { label: "Order reference", value: esc(opts.orderId) },
          { label: "Amount paid", value: `${esc(opts.amount)} ${esc(opts.currency)}` },
          ...(opts.itemName ? [{ label: "For", value: esc(opts.itemName) }] : []),
          ...(opts.payerEmail ? [{ label: "Paid via", value: esc(opts.payerEmail) }] : []),
          { label: "Date", value: esc(opts.date) },
        ],
      })}
      <p style="margin:0;font-size:12px;color:${MUTED};">Questions about this payment? Reply to this email or contact <a href="mailto:${esc(SITE.supportEmail)}" style="color:${PURPLE};font-weight:600;">${esc(SITE.supportEmail)}</a>.</p>
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
  items?: { label: string; amount: string }[];
}): string {
  const items = opts.items?.length
    ? opts.items
    : [{ label: opts.description || "Services", amount: `${opts.amount} ${opts.currency}` }];
  const rowsHtml = items
    .map(
      (it, i) => `
      <tr>
        <td style="padding:12px 20px;border-bottom:${i === items.length - 1 ? "none" : `1px solid ${BORDER}`};background:${i % 2 === 1 ? BG : "#ffffff"};color:${INK};font-size:13px;">${esc(it.label)}</td>
        <td align="right" style="padding:12px 20px;border-bottom:${i === items.length - 1 ? "none" : `1px solid ${BORDER}`};background:${i % 2 === 1 ? BG : "#ffffff"};color:${INK};font-size:13px;font-weight:700;">${esc(it.amount)}</td>
      </tr>`
    )
    .join("");
  return emailLayout({
    badge: "Invoice",
    title: `Invoice ${esc(opts.invoiceNumber)}`,
    preheader: `Invoice ${opts.invoiceNumber} — ${opts.amount} ${opts.currency}${opts.dueDate ? ` due ${opts.dueDate}` : ""}.`,
    body: `
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">Hi${opts.clientName ? ` ${esc(opts.clientName)}` : ""}, thank you for working with ${SITE.name}. Please review the details below${opts.dueDate ? ` — payment is due by <strong style="color:${INK};">${esc(opts.dueDate)}</strong>` : ""}.</p>
      ${infoCard({
        headerLeft: `Invoice ${esc(opts.invoiceNumber)}`,
        headerRight: `${esc(opts.amount)} ${esc(opts.currency)}`,
        rows: [
          { label: "Bill to", value: esc(opts.clientName ?? "—") },
          { label: "Issued by", value: `${esc(SITE.legalName ?? SITE.name)} · ${esc(SITE.location)}` },
          ...(opts.dueDate ? [{ label: "Due date", value: esc(opts.dueDate) }] : []),
        ],
      })}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:${RADIUS - 8}px;overflow:hidden;margin:0 0 18px;box-shadow:0 1px 2px rgba(16,24,40,0.04),0 6px 20px rgba(75,62,161,0.08);">
        <tr>
          <td style="padding:11px 20px;background:${BG};color:${MUTED};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.9px;">Description</td>
          <td align="right" style="padding:11px 20px;background:${BG};color:${MUTED};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.9px;">Amount</td>
        </tr>
        ${rowsHtml}
        <tr>
          <td style="padding:14px 20px;background:${PURPLE}10;color:${PURPLE_DARK};font-size:13px;font-weight:800;border-top:2px solid ${PURPLE};">Total due</td>
          <td align="right" style="padding:14px 20px;background:${PURPLE}10;color:${PURPLE};font-size:16px;font-weight:800;border-top:2px solid ${PURPLE};">${esc(opts.amount)} ${esc(opts.currency)}</td>
        </tr>
      </table>
      <p style="margin:0;font-size:12px;color:${MUTED};">Questions about this invoice? Reply to this email or contact <a href="mailto:${esc(SITE.supportEmail)}" style="color:${PURPLE};font-weight:600;">${esc(SITE.supportEmail)}</a>.</p>
    `,
    cta: { label: "Pay this invoice", href: `${SITE.url.replace(/\/$/, "")}/payment` },
  });
}

export function welcomeEmail(opts: { name?: string | null; loginUrl: string }): string {
  return emailLayout({
    badge: "Welcome aboard",
    title: `Welcome to ${SITE.name}!`,
    preheader: "Your account is ready — manage projects, payments and support.",
    body: `
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">Hi${opts.name ? ` ${esc(opts.name)}` : ""}, thanks for joining ${SITE.name}! Your account is ready. Here's what you can do from your dashboard:</p>
      ${stepsCard([
        { icon: "📁", title: "Projects", desc: "Track your websites, apps & ongoing work in one place." },
        { icon: "💳", title: "Payments", desc: "View invoices, pay securely & download receipts." },
        { icon: "🎫", title: "Support", desc: "Open tickets and get help whenever you need it." },
      ])}
      <p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Need a hand getting started? Our team is one message away — <a href="mailto:${esc(SITE.supportEmail)}" style="color:${PURPLE};font-weight:700;">${esc(SITE.supportEmail)}</a>.</p>
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
    badge: "Subscription active",
    title: `You're subscribed to ${esc(opts.planName)}`,
    preheader: `Your ${opts.planName} subscription is active (${opts.amount} ${opts.currency}/${opts.interval}).`,
    body: `
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">Your recurring subscription is now active. You can manage it any time from your dashboard.</p>
      ${infoCard({
        headerLeft: "Subscription",
        rows: [
          { label: "Plan", value: esc(opts.planName) },
          { label: "Billing", value: `${esc(opts.amount)} ${esc(opts.currency)} / ${esc(opts.interval)}` },
        ],
      })}
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
    title: "You received a payout 💸",
    preheader: `A payout of ${opts.amount} ${opts.currency} was sent to you.`,
    body: `
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">A payment of <strong style="color:${INK};">${esc(opts.amount)} ${esc(opts.currency)}</strong> has been sent to ${esc(opts.recipientEmail)} from ${SITE.name}.</p>
      ${opts.note ? `<div style="background:${BG};border:1px solid ${BORDER};padding:16px 18px;border-radius:${RADIUS - 8}px;font-size:13px;color:${INK};margin:0 0 18px;line-height:1.6;">${esc(opts.note)}</div>` : ""}
    `,
  });
}

export function testEmail(): string {
  return emailLayout({
    badge: "Test",
    title: "SMTP test — it works!",
    preheader: "SMTP configuration verified.",
    body: `
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${MUTED};">This email confirms your SMTP mail system is configured and sending correctly.</p>
      ${infoCard({
        rows: [
          { label: "Status", value: "✅ Delivered" },
          { label: "Sent at", value: new Date().toUTCString() },
        ],
      })}
    `,
  });
}

/** Customer-facing confirmation when a quote / mockup / enquiry is received. */
export function quoteRequestEmail(opts: {
  name?: string | null;
  service?: string | null;
}): string {
  return emailLayout({
    badge: "Request received",
    title: "Thanks — we've got your request!",
    preheader: "We received your enquiry and will get back to you shortly.",
    body: `
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">Hi${opts.name ? ` ${esc(opts.name)}` : ""}, thanks for reaching out to ${SITE.name}${opts.service ? ` about <strong style="color:${INK};">${esc(opts.service)}</strong>` : ""}. A member of our team will review your requirements and reply with a free, no-obligation quotation — usually within one business day.</p>
      ${stepsCard([
        { icon: "✅", title: "Review", desc: "We read your requirements carefully." },
        { icon: "📝", title: "Quotation", desc: "You get a clear, itemised quote — no hidden fees." },
        { icon: "🚀", title: "Kick-off", desc: "Approve it and we start building right away." },
      ])}
      <p style="margin:0;font-size:13px;color:${MUTED};">Need it sooner? Message us on WhatsApp — <a href="${esc(SITE.whatsapp)}" style="color:${PURPLE};font-weight:700;">${esc(SITE.phone)}</a>.</p>
    `,
  });
}

/** Password-reset link emailed by an admin from the user management panel. */
export function adminResetPasswordEmail(opts: {
  name?: string | null;
  resetUrl: string;
}): string {
  return emailLayout({
    badge: "Password reset",
    title: "Reset your password",
    preheader: "A Marwat Tech team member requested a password reset for your account.",
    body: `
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">Hi${opts.name ? ` ${esc(opts.name)}` : ""}, a member of the Marwat Tech team has requested a password reset for your account. Click the button below to choose a new password — the link is valid for a short time only.</p>
      <p style="margin:0 0 20px;font-size:12px;color:${MUTED};">Didn't request this? You can safely ignore this email — your password won't change unless you use the link.</p>
    `,
    cta: { label: "Reset my password", href: opts.resetUrl },
  });
}

/** Email-confirmation link resent by an admin from the user management panel. */
export function adminConfirmationEmail(opts: {
  name?: string | null;
  confirmUrl: string;
}): string {
  return emailLayout({
    badge: "Confirm your email",
    title: "Confirm your email address",
    preheader: "A Marwat Tech team member has sent you a new confirmation link.",
    body: `
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:${MUTED};">Hi${opts.name ? ` ${esc(opts.name)}` : ""}, a member of the Marwat Tech team has sent you a new link to confirm your email address. Click below to finish activating your account.</p>
    `,
    cta: { label: "Confirm my email", href: opts.confirmUrl },
  });
}
