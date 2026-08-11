#!/usr/bin/env node
/**
 * Seed content — services, portfolio, blog posts, testimonials and careers.
 *
 * Populates the content tables that drive the marketing site + admin dashboard.
 * Idempotent: upserts by slug. Run after supabase/schema.sql (or scripts/seed.mjs):
 *
 *   node scripts/seed-content.mjs
 *
 * Content mirrors lib/demo.ts so the live site is identical to the demo fallback.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.warn("⚠️  No .env.local found — relying on process env.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}
const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const nowIso = new Date().toISOString();

// ── Categories (slug → name/sort/description) ─────────────────────────────
const SERVICE_CATS = [
  { name: "Development", slug: "development", sort_order: 1 },
  { name: "Design", slug: "design", sort_order: 2 },
  { name: "Marketing & SEO", slug: "marketing-seo", sort_order: 3 },
  { name: "Maintenance & Support", slug: "maintenance-support", sort_order: 4 },
];
const PORTFOLIO_CATS = [
  { name: "Web Design", slug: "web-design", sort_order: 1 },
  { name: "Web Development", slug: "web-development", sort_order: 2 },
  { name: "Graphic Design", slug: "graphic-design", sort_order: 3 },
  { name: "Social Media", slug: "social-media", sort_order: 4 },
  { name: "SEO", slug: "seo", sort_order: 5 },
];
const BLOG_CATS = [
  { name: "Web Design & Development", slug: "web-design-development", description: "Building and designing websites." },
  { name: "SEO & Marketing", slug: "seo-marketing", description: "Grow organic traffic and conversions." },
  { name: "Business Strategy", slug: "business-strategy", description: "Digital strategy for business growth." },
  { name: "Domain & Hosting", slug: "domain-hosting", description: "Domains, hosting and infrastructure." },
  { name: "Tutorials & Guides", slug: "tutorials-guides", description: "Step-by-step how-to guides." },
  { name: "AI & Future Tech", slug: "ai-future-tech", description: "Artificial intelligence and emerging tech." },
];

// ── Services (mirrors DEMO_SERVICES) ──────────────────────────────────────
// categorySlug maps to SERVICE_CATS; benefits/process/faqs kept as JS objects.
const SERVICES = [
  {
    title: "Web Development", slug: "web-development", icon: "code", cat: "development", featured: true,
    summary: "Custom websites and web applications built with modern frameworks for speed, security and scale.",
    content: "<h2>Modern web development that performs</h2><p>We build fast, secure and scalable websites and web applications using the latest technologies including Next.js, React, Node.js and Supabase. Every project is engineered for Core Web Vitals, accessibility and conversion.</p><p>From marketing sites to complex SaaS dashboards, our development team turns your requirements into robust, maintainable software.</p>",
    benefits: [
      { title: "Blazing fast performance", description: "Optimised builds, edge caching and lazy loading keep Core Web Vitals green." },
      { title: "Secure by default", description: "HTTPS, input validation, RLS and least-privilege access baked in." },
      { title: "SEO-ready", description: "Semantic markup, structured data and sitemaps out of the box." },
      { title: "Scalable architecture", description: "Modular, typed codebases that grow with your business." },
    ],
    process: [
      { step: "01", title: "Discover", description: "We learn about your goals, users and constraints." },
      { step: "02", title: "Design", description: "Wireframes and UI design for your approval." },
      { step: "03", title: "Build", description: "Agile sprints with demos along the way." },
      { step: "04", title: "Launch", description: "Deployment, testing and go-live support." },
    ],
    faqs: [
      { question: "How long does a website take?", answer: "A typical marketing site takes 2–4 weeks; complex web apps 6–12 weeks depending on scope." },
      { question: "Do you provide support after launch?", answer: "Yes — every project includes a warranty period and optional maintenance plans." },
    ],
  },
  {
    title: "Next.js Development", slug: "nextjs-development", icon: "nextjs", cat: "development", featured: true,
    summary: "High-performance React applications with SEO, edge deployment and the best developer experience.",
    content: "<h2>Next.js — the framework for modern web</h2><p>Next.js gives you the best of server-side rendering, static generation and edge functions. We use it to deliver sites that are fast, SEO-friendly and a joy to maintain.</p>",
    benefits: [
      { title: "SEO-first", description: "SSR and SSG mean search engines get full HTML." },
      { title: "Edge deployment", description: "Deploy to Cloudflare or Vercel for global speed." },
      { title: "DX that scales", description: "TypeScript, app router and reusable components." },
    ],
    process: [
      { step: "01", title: "Audit", description: "Review existing stack and goals." },
      { step: "02", title: "Architect", description: "Plan data flow, routing and caching." },
      { step: "03", title: "Develop", description: "Build with typed, tested components." },
      { step: "04", title: "Deploy", description: "CI/CD pipeline with previews." },
    ],
    faqs: [{ question: "Why choose Next.js over WordPress?", answer: "For custom functionality, performance and scale, Next.js is more flexible and faster." }],
  },
  {
    title: "WordPress Website Design", slug: "wordpress-website-design", icon: "wordpress", cat: "development", featured: true,
    summary: "Beautiful, easy-to-manage WordPress sites for blogs, business and media.",
    content: "<h2>WordPress done right</h2><p>We design custom WordPress themes and configure plugins so you get a beautiful site you can manage yourself — without sacrificing performance.</p>",
    benefits: [
      { title: "Easy editing", description: "Intuitive admin your team will actually use." },
      { title: "Huge ecosystem", description: "Plugins and integrations for everything." },
      { title: "Budget friendly", description: "Lower cost of ownership for standard sites." },
    ],
    process: [], faqs: [],
  },
  {
    title: "Ecommerce Website Design", slug: "ecommerce-website-design", icon: "ecommerce", cat: "development", featured: true,
    summary: "Online stores that convert — from product pages to checkout, payments and shipping.",
    content: "<h2>Stores engineered to sell</h2><p>We build ecommerce experiences with fast product pages, frictionless checkout and reliable payments, whether on Shopify, WooCommerce or a custom Next.js store.</p>",
    benefits: [
      { title: "Higher conversion", description: "UX and CRO best practices built in." },
      { title: "Fast checkout", description: "Minimal steps, multiple payment options." },
      { title: "Inventory ready", description: "Integrated product, stock and order management." },
    ],
    process: [], faqs: [],
  },
  {
    title: "Mobile App Development", slug: "mobile-app-development", icon: "mobile", cat: "development", featured: false,
    summary: "iOS & Android apps with React Native and native tooling, from idea to store launch.",
    content: "<h2>Apps your users will love</h2><p>From MVP to full product, we design and develop mobile apps with React Native — one codebase, both platforms, native performance.</p>",
    benefits: [
      { title: "Cross-platform", description: "One codebase for iOS and Android." },
      { title: "API-first", description: "Backend designed for mobile and web." },
      { title: "Store ready", description: "App store submission and updates handled." },
    ],
    process: [], faqs: [],
  },
  {
    title: "UI/UX Design", slug: "ui-ux-design", icon: "design", cat: "design", featured: true,
    summary: "User-centred interface design, wireframes and prototypes that feel effortless.",
    content: "<h2>Design that converts</h2><p>Our designers create intuitive, accessible interfaces backed by research — wireframes, prototypes and polished UI that users love.</p>",
    benefits: [
      { title: "Research driven", description: "Design decisions based on real users." },
      { title: "Interactive prototypes", description: "Test flows before writing code." },
      { title: "Design systems", description: "Consistent, reusable component libraries." },
    ],
    process: [], faqs: [],
  },
  {
    title: "SEO Services", slug: "seo-services", icon: "seo", cat: "marketing-seo", featured: true,
    summary: "Technical SEO, content strategy and link building to grow organic traffic.",
    content: "<h2>Get found on Google</h2><p>We improve technical health, on-page optimisation, content and authority to grow your organic traffic and rankings sustainably.</p>",
    benefits: [
      { title: "Technical SEO", description: "Speed, crawlability and schema fixes." },
      { title: "Content strategy", description: "Keyword research and editorial planning." },
      { title: "Transparent reports", description: "Clear dashboards of rankings and traffic." },
    ],
    process: [], faqs: [],
  },
  {
    title: "Website Maintenance", slug: "website-maintenance", icon: "maintenance", cat: "maintenance-support", featured: true,
    summary: "Security updates, backups, monitoring and support to keep your site healthy.",
    content: "<h2>Keep your site healthy</h2><p>Proactive maintenance plans cover updates, backups, uptime monitoring, security scans and priority support.</p>",
    benefits: [
      { title: "Always secure", description: "Patches and security scans on schedule." },
      { title: "Uptime monitoring", description: "We catch problems before visitors do." },
      { title: "Peace of mind", description: "Priority support when you need it." },
    ],
    process: [], faqs: [],
  },
  {
    title: "AI Solutions", slug: "ai-solutions", icon: "ai", cat: "development", featured: true,
    summary: "Chatbots, automation and AI features that save time and unlock new capabilities.",
    content: "<h2>Practical AI for business</h2><p>We integrate AI where it adds real value — support chatbots, content tools, document processing and workflow automation.</p>",
    benefits: [
      { title: "Support chatbots", description: "24/7 answers trained on your content." },
      { title: "Automation", description: "Cut manual work with smart workflows." },
      { title: "Responsible AI", description: "Privacy-first, auditable implementations." },
    ],
    process: [], faqs: [],
  },
];

// ── Portfolio (mirrors DEMO_PROJECTS) ─────────────────────────────────────
const PROJECTS = [
  {
    title: "NexTrade Finance Dashboard", slug: "nextrade-finance-dashboard", client_name: "NexTrade", industry: "Fintech",
    summary: "A real-time analytics dashboard for a fintech startup, built with Next.js and Supabase.",
    content: "<p>Designed and built a full analytics platform with live charts, role-based access and edge deployment.</p>",
    technologies: ["Next.js", "Supabase", "Tailwind CSS", "Recharts"],
    images: [], cover_image: null, project_url: "https://example.com", cat: "web-development", featured: true,
  },
  {
    title: "Bloom & Co Ecommerce", slug: "bloom-co-ecommerce", client_name: "Bloom & Co", industry: "Retail",
    summary: "A headless ecommerce store with a fast, conversion-focused shopping experience.",
    content: "<p>Built a headless storefront with Stripe payments, inventory sync and sub-second page loads.</p>",
    technologies: ["Next.js", "Stripe", "Supabase"],
    images: [], cover_image: null, project_url: null, cat: "web-development", featured: true,
  },
  {
    title: "UrbanEats Restaurant Site", slug: "urbaneats-restaurant", client_name: "UrbanEats", industry: "Hospitality",
    summary: "A vibrant, brand-led website for a restaurant group with online reservations.",
    content: "<p>A fast, accessible marketing site with reservations, menus and SEO in six cities.</p>",
    technologies: ["Next.js", "Sanity"],
    images: [], cover_image: null, project_url: null, cat: "web-design", featured: true,
  },
  {
    title: "FitTrack Mobile App", slug: "fittrack-mobile-app", client_name: "FitTrack", industry: "Health & Fitness",
    summary: "A cross-platform fitness tracking app with social challenges and analytics.",
    content: "<p>React Native app with offline-first data sync, push notifications and wearable integration.</p>",
    technologies: ["React Native", "Supabase", "Expo"],
    images: [], cover_image: null, project_url: null, cat: "web-development", featured: false,
  },
  {
    title: "LawBridge Firm Website", slug: "lawbridge-firm", client_name: "LawBridge", industry: "Legal",
    summary: "A professional, SEO-optimised website for a law firm with practice area pages.",
    content: "<p>Designed a trusted, conversion-focused site with case study pages and lead forms.</p>",
    technologies: ["WordPress", "Elementor", "Rank Math"],
    images: [], cover_image: null, project_url: null, cat: "web-design", featured: false,
  },
  {
    title: "BrandKit Rebrand", slug: "brandkit-rebrand", client_name: "BrandKit", industry: "Branding",
    summary: "Complete visual identity — logo, colour system, typography and social templates.",
    content: "<p>A full brand refresh including guidelines, social media kits and stationery.</p>",
    technologies: ["Figma", "Illustrator"],
    images: [], cover_image: null, project_url: null, cat: "graphic-design", featured: false,
  },
];

// ── Blog posts (mirrors DEMO_POSTS) ───────────────────────────────────────
const POSTS = [
  {
    title: "Why Next.js is the Best Framework for SEO in 2026", slug: "why-nextjs-best-framework-seo-2026", cat: "web-design-development", reading_time: 4,
    excerpt: "Server-side rendering, structured data and edge deployment make Next.js a powerhouse for search rankings. Here’s how we use it.",
    content: "<h2>The SEO advantage of Next.js</h2><p>Search engines love fast, crawlable pages. With Next.js, every page ships as HTML — no JavaScript required to see content. That alone puts you ahead of most single-page apps.</p><h3>Key benefits</h3><ul><li>SSR and SSG for instant content</li><li>Automatic sitemaps and metadata</li><li>Edge caching for global speed</li></ul>",
    cover_image: null,
  },
  {
    title: "10 On-Page SEO Mistakes That Kill Your Rankings", slug: "10-on-page-seo-mistakes-kill-rankings", cat: "seo-marketing", reading_time: 6,
    excerpt: "Avoid these common on-page SEO mistakes and give your pages the best chance of ranking in 2026.",
    content: "<h2>Common on-page SEO mistakes</h2><p>Duplicate titles, missing alt text, slow Core Web Vitals, keyword cannibalisation — we see the same issues on almost every audit. Here’s what to fix first.</p>",
    cover_image: null,
  },
  {
    title: "Choosing the Right Domain & Hosting for Your Business", slug: "choosing-right-domain-hosting-business", cat: "domain-hosting", reading_time: 5,
    excerpt: "Your domain and hosting set the foundation for performance, security and trust. A practical guide.",
    content: "<h2>Foundation first</h2><p>A good domain is short, brandable and .com if possible. Hosting should match your traffic and region. Here’s how to choose.</p>",
    cover_image: null,
  },
  {
    title: "AI in Small Business: Where It Actually Pays Off", slug: "ai-small-business-where-it-pays-off", cat: "ai-future-tech", reading_time: 4,
    excerpt: "Chatbots, content, document processing — where AI delivers real ROI for small businesses today.",
    content: "<h2>Practical AI wins</h2><p>Not every AI trend is worth chasing. Support chatbots, automated replies and document processing deliver measurable savings right now.</p>",
    cover_image: null,
  },
  {
    title: "Ecommerce UX: 7 Tweaks That Lift Conversion", slug: "ecommerce-ux-7-tweaks-lift-conversion", cat: "seo-marketing", reading_time: 5,
    excerpt: "Small UX changes — product photos, checkout length, trust signals — can meaningfully raise conversion rates.",
    content: "<h2>Conversion-focused UX</h2><p>Speed up checkout, show real reviews, add sticky add-to-cart and reduce form fields. These seven tweaks routinely lift conversion by double digits.</p>",
    cover_image: null,
  },
  {
    title: "How to Plan a Website Redesign Without Losing SEO", slug: "plan-website-redesign-without-losing-seo", cat: "web-design-development", reading_time: 6,
    excerpt: "A redesign is a great opportunity — and a risk. Keep your rankings with this migration checklist.",
    content: "<h2>Redesign without ranking loss</h2><p>Map old URLs, keep redirects, preserve content and monitor after launch. A structured plan avoids the classic redesign ranking cliff.</p>",
    cover_image: null,
  },
];

// ── Testimonials (mirrors DEMO_TESTIMONIALS) ──────────────────────────────
const TESTIMONIALS = [
  { client_name: "Ahmed Raza", company: "NexTrade", role: "CEO", quote: "Marwat Tech delivered our dashboard ahead of schedule. The code is clean, fast and the team communicates brilliantly.", rating: 5, avatar_url: null, featured: true, sort_order: 1 },
  { client_name: "Sarah Mitchell", company: "Bloom & Co", role: "Founder", quote: "Our online store loads instantly and conversions are up 40%. They truly understand ecommerce.", rating: 5, avatar_url: null, featured: true, sort_order: 2 },
  { client_name: "David Chen", company: "FitTrack", role: "Product Manager", quote: "Professional, responsive and technically excellent. The app was approved by both app stores on the first submission.", rating: 5, avatar_url: null, featured: true, sort_order: 3 },
  { client_name: "Fatima Khan", company: "UrbanEats", role: "Marketing Director", quote: "SEO traffic tripled within four months. The redesign looks stunning and our guests love it.", rating: 5, avatar_url: null, featured: false, sort_order: 4 },
  { client_name: "James Okafor", company: "LawBridge", role: "Partner", quote: "From mockup to launch in three weeks. A smooth process with a website that brings us real leads.", rating: 5, avatar_url: null, featured: false, sort_order: 5 },
  { client_name: "Ayesha Malik", company: "BrandKit", role: "Owner", quote: "The free mockup impressed us immediately — we knew we were in good hands. Highly recommended.", rating: 5, avatar_url: null, featured: false, sort_order: 6 },
];

// ── Careers (mirrors DEMO_CAREERS) ────────────────────────────────────────
const CAREERS = [
  {
    title: "Senior Next.js Developer", slug: "senior-nextjs-developer", department: "Engineering", location: "Remote", job_type: "Full-time", salary_range: "$3,000 – $5,000 / month",
    description: "<p>We are looking for a senior Next.js developer to lead client projects. You will own architecture, mentor juniors and deliver production-grade apps.</p>",
    requirements: "<ul><li>5+ years of React/Next.js experience</li><li>Strong TypeScript and SQL skills</li><li>Experience with Supabase or similar</li></ul>",
  },
  {
    title: "UI/UX Designer", slug: "ui-ux-designer", department: "Design", location: "Bannu / Remote", job_type: "Full-time", salary_range: "$1,500 – $2,500 / month",
    description: "<p>We are hiring a designer who sweats the details — wireframes to polished UI, always thinking about users and conversion.</p>",
    requirements: "<ul><li>3+ years of product design experience</li><li>Strong Figma portfolio</li><li>Understanding of accessibility</li></ul>",
  },
  {
    title: "SEO Specialist", slug: "seo-specialist", department: "Marketing", location: "Remote", job_type: "Contract", salary_range: "Negotiable",
    description: "<p>You will run technical and content SEO for client sites, from audits to keyword strategy and reporting.</p>",
    requirements: "<ul><li>Hands-on technical SEO experience</li><li>Analytics and search console expertise</li><li>Strong written English</li></ul>",
  },
];

// ── Settings defaults ─────────────────────────────────────────────────────
const SETTINGS = [
  ["site_name", "Marwat Tech"],
  ["site_tagline", "Software & Web Development Company"],
  ["contact_email", "info@marwattech.com"],
  ["support_email", "support@marwattech.com"],
  ["form_notify_email", "info@marwattech.com,support@marwattech.com"],
  ["default_meta_title", "Marwat Tech | Web Development, Ecommerce, SEO & AI Solutions"],
  ["default_meta_description", "Marwat Tech builds high-performance websites, ecommerce stores, mobile apps and AI solutions for growing businesses."],
  ["og_image", ""],
  ["gtm_id", ""],
  ["ga_id", ""],
  ["clarity_id", ""],
  ["posthog_key", ""],
  ["announcement_bar", ""],
  ["announcement_enabled", "false"],
];

async function seedCats(table, rows, extra = {}) {
  for (const c of rows) await sb.from(table).upsert({ ...c, ...extra }, { onConflict: "slug" });
  const { data } = await sb.from(table).select("id, slug");
  const map = {};
  for (const r of data ?? []) map[r.slug] = r.id;
  return map;
}

async function seed() {
  console.log("🌱 Seeding Marwat Tech content…");

  const serviceCatMap = await seedCats("service_categories", SERVICE_CATS);
  const portfolioCatMap = await seedCats("portfolio_categories", PORTFOLIO_CATS);
  const blogCatMap = await seedCats("blog_categories", BLOG_CATS);
  console.log(`✅ Categories: ${Object.keys(serviceCatMap).length} service, ${Object.keys(portfolioCatMap).length} portfolio, ${Object.keys(blogCatMap).length} blog`);

  for (const [key, value] of SETTINGS) {
    await sb.from("site_settings").upsert({ key, value }, { onConflict: "key" });
  }
  console.log(`✅ ${SETTINGS.length} site settings`);

  for (const s of SERVICES) {
    await sb.from("services").upsert({
      title: s.title, slug: s.slug, icon: s.icon, summary: s.summary, content: s.content,
      benefits: s.benefits, process: s.process, faqs: s.faqs,
      category_id: serviceCatMap[s.cat] ?? null,
      status: "published", featured: s.featured,
      created_at: nowIso, updated_at: nowIso,
    }, { onConflict: "slug" });
  }
  console.log(`✅ ${SERVICES.length} services`);

  for (const p of PROJECTS) {
    await sb.from("portfolio_items").upsert({
      title: p.title, slug: p.slug, client_name: p.client_name, industry: p.industry,
      summary: p.summary, content: p.content, technologies: p.technologies, images: p.images,
      cover_image: p.cover_image, project_url: p.project_url,
      category_id: portfolioCatMap[p.cat] ?? null,
      status: "published", featured: p.featured,
      created_at: nowIso, updated_at: nowIso,
    }, { onConflict: "slug" });
  }
  console.log(`✅ ${PROJECTS.length} portfolio items`);

  for (const b of POSTS) {
    await sb.from("blog_posts").upsert({
      title: b.title, slug: b.slug, excerpt: b.excerpt, content: b.content, cover_image: b.cover_image,
      category_id: blogCatMap[b.cat] ?? null, reading_time: b.reading_time,
      status: "published", published_at: nowIso,
      created_at: nowIso, updated_at: nowIso,
    }, { onConflict: "slug" });
  }
  console.log(`✅ ${POSTS.length} blog posts`);

  // Testimonials have no unique slug — wipe & re-insert so re-runs stay idempotent.
  await sb.from("testimonials").delete().neq("client_name", "__never__");
  for (const t of TESTIMONIALS) {
    await sb.from("testimonials").insert({
      client_name: t.client_name, company: t.company, role: t.role, quote: t.quote,
      rating: t.rating, avatar_url: t.avatar_url, featured: t.featured,
      status: "published", sort_order: t.sort_order, created_at: nowIso,
    });
  }
  console.log(`✅ ${TESTIMONIALS.length} testimonials`);

  for (const c of CAREERS) {
    await sb.from("careers").upsert({
      title: c.title, slug: c.slug, department: c.department, location: c.location,
      job_type: c.job_type, salary_range: c.salary_range,
      description: c.description, requirements: c.requirements,
      status: "published", created_at: nowIso, updated_at: nowIso,
    }, { onConflict: "slug" });
  }
  console.log(`✅ ${CAREERS.length} careers`);

  console.log("🎉 Done. Homepage, /services, /portfolio, /blog and /careers now use live DB content.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message ?? err);
  process.exit(1);
});
