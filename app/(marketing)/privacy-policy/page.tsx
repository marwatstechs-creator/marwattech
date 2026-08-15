import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  return legalMetadata(
    "Privacy Policy",
    "How Marwat Tech collects, uses and protects your personal information.",
    "/privacy-policy"
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="Your privacy matters to us. This policy explains what we collect, why we collect it and how we protect it."
      lastUpdated="2026-08-01"
      sections={[
        {
          heading: "1. Information we collect",
          body: [
            "When you use our contact, support or mockup forms, we collect the details you provide — such as your name, email address, phone number and the content of your message.",
            "We may also collect limited technical data automatically, including your browser type, device information and pages visited, through analytics tools like Google Analytics and Microsoft Clarity.",
          ],
        },
        {
          heading: "2. How we use your information",
          body: [
            "We use the information you provide to respond to your enquiries, deliver the services you request, send you relevant communications you have opted into, and improve our website and services.",
            "We do not sell your personal data to third parties. Ever.",
          ],
        },
        {
          heading: "3. Cookies and analytics",
          body: [
            "Our website uses cookies and similar technologies to understand how visitors use the site and to improve performance. You can control cookies through your browser settings.",
            "We use Google Tag Manager, Google Analytics, Microsoft Clarity and PostHog to measure site usage. These tools may set cookies and collect anonymised usage data.",
          ],
        },
        {
          heading: "4. Data storage and security",
          body: [
            "Your data is stored securely on Supabase infrastructure with encryption in transit and at rest, protected by role-based access controls.",
            "We limit access to personal data to only those team members who need it to perform their duties.",
          ],
        },
        {
          heading: "5. Your rights",
          body: [
            "Depending on your location, you may have the right to access, correct, delete or export your personal data, and to object to certain processing.",
            "To exercise any of these rights, contact us at privacy@marwattech.com and we will respond within 30 days.",
          ],
        },
        {
          heading: "6. Contact us",
          body: [
            "If you have questions about this Privacy Policy, please contact us at privacy@marwattech.com or via our contact page.",
          ],
        },
      ]}
    />
  );
}
