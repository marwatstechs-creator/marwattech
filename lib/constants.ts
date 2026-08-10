export const SITE = {
  name: "Marwat Tech",
  legalName: "Marwat Tech (Pvt) Ltd.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://marwattech.com",
  description:
    "Marwat Tech is a full-service software & web development company offering website design, ecommerce, mobile apps, UI/UX, SEO and AI solutions for businesses of every size.",
  email: "info@marwattech.com",
  supportEmail: "support@marwattech.com",
  salesEmail: "sales@marwattech.com",
  phone: "+92 300 1234567",
  whatsapp: "https://wa.me/923001234567",
  address: "Marwat Tech, Bannu, Khyber Pakhtunkhwa, Pakistan",
  hours: "Mon – Sat, 9:00 AM – 6:00 PM (PKT)",
  social: {
    facebook: "https://facebook.com/marwattech",
    twitter: "https://twitter.com/marwattech",
    linkedin: "https://linkedin.com/company/marwattech",
    instagram: "https://instagram.com/marwattech",
    youtube: "https://youtube.com/@marwattech",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
};

export const SERVICES = [
  {
    title: "Web Development",
    href: "/services/web-development",
    icon: "code",
    short:
      "Custom websites & web apps built with modern frameworks for speed, security and scale.",
  },
  {
    title: "Next.js Development",
    href: "/services/nextjs-development",
    icon: "nextjs",
    short:
      "High-performance React applications with SEO, edge deployment and the best developer experience.",
  },
  {
    title: "WordPress Website Design",
    href: "/services/wordpress-website-design",
    icon: "wordpress",
    short:
      "Beautiful, easy-to-manage WordPress sites for blogs, business and media.",
  },
  {
    title: "Ecommerce Website Design",
    href: "/services/ecommerce-website-design",
    icon: "ecommerce",
    short:
      "Online stores that convert — from product pages to checkout, payments and shipping.",
  },
  {
    title: "Mobile App Development",
    href: "/services/mobile-app-development",
    icon: "mobile",
    short:
      "iOS & Android apps with React Native and native tooling, from idea to store launch.",
  },
  {
    title: "UI/UX Design",
    href: "/services/ui-ux-design",
    icon: "design",
    short:
      "User-centred interface design, wireframes and prototypes that feel effortless.",
  },
  {
    title: "SEO Services",
    href: "/services/seo-services",
    icon: "seo",
    short:
      "Technical SEO, content strategy and link building to grow organic traffic.",
  },
  {
    title: "Website Maintenance",
    href: "/services/website-maintenance",
    icon: "maintenance",
    short:
      "Security updates, backups, monitoring and support to keep your site healthy.",
  },
  {
    title: "AI Solutions",
    href: "/services/ai-solutions",
    icon: "ai",
    short:
      "Chatbots, automation and AI features that save time and unlock new capabilities.",
  },
] as const;

export const PORTFOLIO_CATEGORIES = [
  { label: "All Work", slug: "all" },
  { label: "Web Design", slug: "web-design" },
  { label: "Web Development", slug: "web-development" },
  { label: "Graphic Design", slug: "graphic-design" },
  { label: "Social Media", slug: "social-media" },
  { label: "SEO", slug: "seo" },
] as const;

export const BLOG_CATEGORIES = [
  { label: "Web Design & Development", slug: "web-design-development" },
  { label: "SEO & Marketing", slug: "seo-marketing" },
  { label: "Business Strategy", slug: "business-strategy" },
  { label: "Domain & Hosting", slug: "domain-hosting" },
  { label: "Tutorials & Guides", slug: "tutorials-guides" },
  { label: "AI & Future Tech", slug: "ai-future-tech" },
] as const;

export const MAIN_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Services",
    href: "/services",
    children: SERVICES.map((s) => ({ label: s.title, href: s.href })),
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    children: PORTFOLIO_CATEGORIES.map((c) => ({
      label: c.label,
      href: `/portfolio/${c.slug}`,
    })),
  },
  { label: "Blog", href: "/blog" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export const SUPPORT_ISSUE_TYPES = [
  "Website not loading",
  "Login / account issue",
  "Billing & invoices",
  "Domain / hosting",
  "Bug or broken feature",
  "Security concern",
  "Other",
] as const;

export const MOCKUP_WEBSITE_TYPES = [
  "Business / corporate website",
  "Ecommerce / online store",
  "Blog / content website",
  "Portfolio / personal site",
  "Web application",
  "Landing page",
  "Mobile app",
  "Other",
] as const;

export const MOCKUP_BUDGETS = [
  "Under $500",
  "$500 – $1,000",
  "$1,000 – $3,000",
  "$3,000 – $5,000",
  "$5,000+",
] as const;

export const STATS = [
  { value: "150+", label: "Projects Delivered" },
  { value: "120+", label: "Happy Clients" },
  { value: "8+", label: "Years Experience" },
  { value: "24/7", label: "Support" },
] as const;

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Domain & Hosting Terms", href: "/domain-and-hosting-terms" },
] as const;
