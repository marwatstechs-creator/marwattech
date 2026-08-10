import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";

export const metadata = legalMetadata(
  "Terms of Service",
  "The terms and conditions that govern the use of Marwat Tech services.",
  "/terms-of-service"
);

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="Please read these terms carefully — they govern your use of our website and services."
      lastUpdated="2026-08-01"
      sections={[
        {
          heading: "1. Acceptance of terms",
          body: [
            "By accessing the Marwat Tech website or using our services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.",
          ],
        },
        {
          heading: "2. Services",
          body: [
            "Marwat Tech provides web design, web development, ecommerce, mobile app development, UI/UX design, SEO, maintenance and AI solutions as described on our website.",
            "Specific deliverables, timelines and pricing for each project are agreed in a written proposal or contract before work begins.",
          ],
        },
        {
          heading: "3. Quotes and payments",
          body: [
            "Free mockups are provided at no cost and without obligation. Paid work begins only after a proposal is approved and, where required, a deposit is received.",
            "Payment terms are stated in each proposal. Failure to pay agreed amounts may result in suspension of work or services.",
          ],
        },
        {
          heading: "4. Client responsibilities",
          body: [
            "Clients agree to provide accurate information, timely feedback and any materials needed to complete the project on schedule.",
            "Clients are responsible for the accuracy of content they provide and for maintaining the security of their own account credentials.",
          ],
        },
        {
          heading: "5. Intellectual property",
          body: [
            "Upon full payment, ownership of custom deliverables (designs, code and content created specifically for the project) transfers to the client.",
            "Marwat Tech may use third-party tools, libraries and stock resources subject to their own licences. We reserve the right to display completed work in our portfolio unless agreed otherwise.",
          ],
        },
        {
          heading: "6. Limitation of liability",
          body: [
            "To the maximum extent permitted by law, Marwat Tech is not liable for indirect, incidental or consequential damages arising from the use of our services or website.",
            "Our total liability for any claim is limited to the amount paid for the specific service giving rise to the claim.",
          ],
        },
        {
          heading: "7. Changes to these terms",
          body: [
            "We may update these Terms from time to time. Continued use of our services after changes take effect constitutes acceptance of the revised terms.",
          ],
        },
        {
          heading: "8. Contact",
          body: [
            "Questions about these Terms can be sent to info@marwattech.com.",
          ],
        },
      ]}
    />
  );
}
