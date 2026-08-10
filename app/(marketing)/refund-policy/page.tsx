import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";

export const metadata = legalMetadata(
  "Refund Policy",
  "Our refund and cancellation policy for digital services.",
  "/refund-policy"
);

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      description="We want you to be happy with our work. Here’s how refunds and cancellations work."
      lastUpdated="2026-08-01"
      sections={[
        {
          heading: "1. Free mockups",
          body: [
            "Free mockup designs are provided at no cost and are non-refundable (as nothing is paid). You are under no obligation to proceed after receiving a mockup.",
          ],
        },
        {
          heading: "2. Project deposits",
          body: [
            "Project deposits secure your slot in our schedule and cover initial discovery and design work. Deposits are generally non-refundable once design work has begun.",
            "If we are unable to begin or complete a project due to reasons on our side, we will refund any unearned portion of payments in full.",
          ],
        },
        {
          heading: "3. Cancellation during a project",
          body: [
            "If a client cancels a project after work has started, a refund of the unused portion may be issued, calculated on the basis of work completed against the total project value, minus any non-recoverable costs.",
          ],
        },
        {
          heading: "4. Completed projects",
          body: [
            "For completed and delivered projects, we offer a defect-fix warranty (typically 30 days) during which we fix genuine bugs at no charge. Fees for completed work are non-refundable.",
          ],
        },
        {
          heading: "5. Subscription services",
          body: [
            "Maintenance and support plans may be cancelled with 30 days’ notice. Refunds for the unused portion of a billing period may be provided at our discretion.",
          ],
        },
        {
          heading: "6. How to request a refund",
          body: [
            "Email billing@marwattech.com with your project details. We review every request fairly and respond within 5 business days.",
          ],
        },
      ]}
    />
  );
}
