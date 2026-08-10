import { LegalPage, legalMetadata } from "@/components/marketing/legal-page";

export const metadata = legalMetadata(
  "Domain & Hosting Terms",
  "Terms that apply to domain registration and hosting services provided by Marwat Tech.",
  "/domain-and-hosting-terms"
);

export default function DomainHostingTermsPage() {
  return (
    <LegalPage
      title="Domain & Hosting Terms"
      description="The terms that apply when Marwat Tech registers domains or provides hosting services on your behalf."
      lastUpdated="2026-08-01"
      sections={[
        {
          heading: "1. Domain registration",
          body: [
            "When we register a domain on your behalf, the domain remains the property of the registrant (usually you). We act as a registration agent under the registrar’s terms.",
            "Renewal is your responsibility; we will send reminders before expiry. Failure to renew may result in loss of the domain.",
          ],
        },
        {
          heading: "2. Hosting services",
          body: [
            "Hosting plans include the resources and features described at sign-up. We may upgrade, migrate or optimise your hosting to maintain performance and security.",
            "We aim for 99.9% uptime but cannot be held liable for downtime caused by third-party providers, DDoS attacks or factors beyond our reasonable control.",
          ],
        },
        {
          heading: "3. Acceptable use",
          body: [
            "Hosting may not be used for illegal activity, spam, malware distribution or content that violates applicable law. We may suspend services that breach this policy.",
          ],
        },
        {
          heading: "4. Backups",
          body: [
            "Standard plans include regular backups. Restoration is available on request and may be subject to additional fees for large restorations.",
            "Clients are encouraged to keep their own copies of critical data.",
          ],
        },
        {
          heading: "5. Billing and renewal",
          body: [
            "Domains and hosting are billed on the cycle agreed at sign-up. Late renewals may incur fees or service interruption. We will always attempt to contact you before suspension.",
          ],
        },
        {
          heading: "6. Transfer and termination",
          body: [
            "You may transfer your domain or hosting away at any time. We will assist with transfer processes and provide access credentials on request.",
            "Terminating hosting does not automatically cancel a domain registration; please confirm separately if you wish to cancel the domain.",
          ],
        },
        {
          heading: "7. Contact",
          body: [
            "For domain or hosting questions, contact support@marwattech.com.",
          ],
        },
      ]}
    />
  );
}
