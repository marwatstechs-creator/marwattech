import {
  adminConfirmationEmail,
  adminResetPasswordEmail,
  courseUpdateEmail,
  invoiceEmail,
  orderConfirmationEmail,
  paymentReceiptEmail,
  payoutNoticeEmail,
  quoteRequestEmail,
  subscriptionConfirmationEmail,
  testEmail,
  welcomeEmail,
} from "@/lib/email/templates";

export const dynamic = "force-dynamic";

/** Pull just the <body>…</body> inner HTML out of a full email document. */
function inner(html: string): string {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  return m ? m[1] : html;
}

/** Design-preview page for all branded email templates (sample data only). */
export async function GET() {
  const site = "https://www.marwattech.com";
  const samples: { name: string; html: string }[] = [
    {
      name: "Course Update Digest",
      html: courseUpdateEmail({
        recipientEmail: "student@example.com",
        unsubscribeUrl: `${site}/api/course-unsubscribe?token=sample`,
        courses: [
          {
            title: "Master React & Next.js — Full Course 2026",
            summaryPoints: [
              "New lesson added: Building Your First Reusable Component",
              "New lesson added: Getting Started with Next.js App Router",
            ],
            url: "https://www.udemy.com/course/react-nextjs/?couponCode=SAMPLE",
            isFree: false,
            price: 19.99,
          },
          {
            title: "Complete SEO Masterclass",
            summaryPoints: ["Updated module: Core Web Vitals", "Fixed quiz in lesson 12"],
            url: "https://www.udemy.com/course/seo/?couponCode=SAMPLE2",
            isFree: true,
          },
        ],
      }),
    },
    { name: "Welcome Email", html: welcomeEmail({ name: "Ahmed", loginUrl: `${site}/client/login` }) },
    {
      name: "Payment Receipt",
      html: paymentReceiptEmail({
        orderId: "MT-2026-00842",
        amount: "1,500",
        currency: "PKR",
        itemName: "Website Development — Landing Page",
        customerName: "Ahmed Khan",
        payerEmail: "ahmed@example.com",
        date: "15 Aug 2026",
      }),
    },
    {
      name: "Order Confirmation (Google-style)",
      html: orderConfirmationEmail({
        orderNumber: "PDS.6669-3610-9957-37306",
        placedDate: "Sat 15 Aug 2026",
        customerName: "Ahmed Khan",
        items: [
          { name: "Developer Registration Fee", quantity: 1, price: "US$25.00" },
        ],
        subtotal: "US$25.00",
        tax: "US$0.00",
        total: "US$25.00",
        currency: "US$",
        paymentMethod: "Mastercard •••• 4548",
        viewUrl: `${site}/client/orders/sample`,
      }),
    },
    {
      name: "Invoice",
      html: invoiceEmail({
        invoiceNumber: "INV-1042",
        clientName: "Ahmed Khan",
        amount: "75,000",
        currency: "PKR",
        dueDate: "30 Aug 2026",
        items: [
          { label: "Website development (phase 1)", amount: "50,000 PKR" },
          { label: "SEO setup", amount: "25,000 PKR" },
        ],
      }),
    },
    {
      name: "Subscription Active",
      html: subscriptionConfirmationEmail({
        planName: "Growth",
        amount: "9,999",
        currency: "PKR",
        interval: "month",
      }),
    },
    {
      name: "Payout Notice",
      html: payoutNoticeEmail({
        recipientEmail: "partner@example.com",
        amount: "12,000",
        currency: "PKR",
        note: "July affiliate earnings.",
      }),
    },
    {
      name: "Quote Request Confirmation",
      html: quoteRequestEmail({ name: "Sara", service: "Ecommerce Website" }),
    },
    { name: "Admin Reset Password", html: adminResetPasswordEmail({ name: "Ahmed", resetUrl: `${site}/auth/reset-password?token=sample` }) },
    { name: "Admin Email Confirmation", html: adminConfirmationEmail({ name: "Ahmed", confirmUrl: `${site}/auth/confirm?token=sample` }) },
    { name: "SMTP Test", html: testEmail() },
  ];

  const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Marwat Tech — Email Template Preview</title>
<style>
  body{margin:0;padding:40px 12px 80px;background:#e9e8f2;font-family:Inter,-apple-system,'Segoe UI',Roboto,sans-serif;color:#101828;}
  .wrap{max-width:640px;margin:0 auto;}
  h1{text-align:center;font-size:22px;font-weight:800;letter-spacing:-0.3px;}
  .sub{text-align:center;color:#667085;font-size:13px;margin-bottom:34px;}
  .sample{margin:0 0 48px;}
  .label{text-align:center;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#8b5cf6;margin-bottom:8px;}
  .frame{border-radius:20px;overflow:hidden;box-shadow:0 2px 6px rgba(16,24,40,0.08),0 20px 50px rgba(75,62,161,0.15);}
</style>
</head>
<body>
  <div class="wrap">
    <h1>✉️ Marwat Tech — Email Templates</h1>
    <p class="sub">iOS-27 liquid-glass style · purple + gold · squircle cards · emoji icons · mobile responsive</p>
    ${samples
      .map(
        (s) => `
      <div class="sample">
        <div class="label">${s.name}</div>
        <div class="frame">${inner(s.html)}</div>
      </div>`
      )
      .join("")}
  </div>
</body>
</html>`;

  return new Response(page, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
