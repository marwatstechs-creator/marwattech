/**
 * Demo / fallback content used when Supabase is not configured yet or a query
 * fails. Also a good starting point for real content — publish via the admin.
 */
import type { Database } from "@/types/database";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Project = Database["public"]["Tables"]["portfolio_items"]["Row"];
type Post = Database["public"]["Tables"]["blog_posts"]["Row"];
type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
type Career = Database["public"]["Tables"]["careers"]["Row"];

const now = new Date().toISOString();

export const DEMO_SERVICES: Service[] = [
  {
    id: "s1", title: "Web Development", slug: "web-development", icon: "code",
    summary: "Custom websites and web applications built with modern frameworks for speed, security and scale.",
    content: "<h2>Modern web development that performs</h2><p>We build fast, secure and scalable websites and web applications using the latest technologies including Next.js, React, Node.js and Supabase. Every project is engineered for Core Web Vitals, accessibility and conversion.</p><p>From marketing sites to complex SaaS dashboards, our development team turns your requirements into robust, maintainable software.</p>",
    benefits: [{"title":"Blazing fast performance","description":"Optimised builds, edge caching and lazy loading keep Core Web Vitals green."},{"title":"Secure by default","description":"HTTPS, input validation, RLS and least-privilege access baked in."},{"title":"SEO-ready","description":"Semantic markup, structured data and sitemaps out of the box."},{"title":"Scalable architecture","description":"Modular, typed codebases that grow with your business."}] as never,
    process: [{"step":"01","title":"Discover","description":"We learn about your goals, users and constraints."},{"step":"02","title":"Design","description":"Wireframes and UI design for your approval."},{"step":"03","title":"Build","description":"Agile sprints with demos along the way."},{"step":"04","title":"Launch","description":"Deployment, testing and go-live support."}] as never,
    faqs: [{"question":"How long does a website take?","answer":"A typical marketing site takes 2–4 weeks; complex web apps 6–12 weeks depending on scope."},{"question":"Do you provide support after launch?","answer":"Yes — every project includes a warranty period and optional maintenance plans."}] as never,
    category_id: null, status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "s2", title: "Next.js Development", slug: "nextjs-development", icon: "nextjs",
    summary: "High-performance React applications with SEO, edge deployment and the best developer experience.",
    content: "<h2>Next.js — the framework for modern web</h2><p>Next.js gives you the best of server-side rendering, static generation and edge functions. We use it to deliver sites that are fast, SEO-friendly and a joy to maintain.</p>",
    benefits: [{"title":"SEO-first","description":"SSR and SSG mean search engines get full HTML."},{"title":"Edge deployment","description":"Deploy to Cloudflare or Vercel for global speed."},{"title":"DX that scales","description":"TypeScript, app router and reusable components."}] as never,
    process: [{"step":"01","title":"Audit","description":"Review existing stack and goals."},{"step":"02","title":"Architect","description":"Plan data flow, routing and caching."},{"step":"03","title":"Develop","description":"Build with typed, tested components."},{"step":"04","title":"Deploy","description":"CI/CD pipeline with previews."}] as never,
    faqs: [{"question":"Why choose Next.js over WordPress?","answer":"For custom functionality, performance and scale, Next.js is more flexible and faster."}] as never,
    category_id: null, status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "s3", title: "WordPress Website Design", slug: "wordpress-website-design", icon: "wordpress",
    summary: "Beautiful, easy-to-manage WordPress sites for blogs, business and media.",
    content: "<h2>WordPress done right</h2><p>We design custom WordPress themes and configure plugins so you get a beautiful site you can manage yourself — without sacrificing performance.</p>",
    benefits: [{"title":"Easy editing","description":"Intuitive admin your team will actually use."},{"title":"Huge ecosystem","description":"Plugins and integrations for everything."},{"title":"Budget friendly","description":"Lower cost of ownership for standard sites."}] as never,
    process: [], faqs: [], category_id: null, status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "s4", title: "Ecommerce Website Design", slug: "ecommerce-website-design", icon: "ecommerce",
    summary: "Online stores that convert — from product pages to checkout, payments and shipping.",
    content: "<h2>Stores engineered to sell</h2><p>We build ecommerce experiences with fast product pages, frictionless checkout and reliable payments, whether on Shopify, WooCommerce or a custom Next.js store.</p>",
    benefits: [{"title":"Higher conversion","description":"UX and CRO best practices built in."},{"title":"Fast checkout","description":"Minimal steps, multiple payment options."},{"title":"Inventory ready","description":"Integrated product, stock and order management."}] as never,
    process: [], faqs: [], category_id: null, status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "s5", title: "Mobile App Development", slug: "mobile-app-development", icon: "mobile",
    summary: "iOS & Android apps with React Native and native tooling, from idea to store launch.",
    content: "<h2>Apps your users will love</h2><p>From MVP to full product, we design and develop mobile apps with React Native — one codebase, both platforms, native performance.</p>",
    benefits: [{"title":"Cross-platform","description":"One codebase for iOS and Android."},{"title":"API-first","description":"Backend designed for mobile and web."},{"title":"Store ready","description":"App store submission and updates handled."}] as never,
    process: [], faqs: [], category_id: null, status: "published", featured: false,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "s6", title: "UI/UX Design", slug: "ui-ux-design", icon: "design",
    summary: "User-centred interface design, wireframes and prototypes that feel effortless.",
    content: "<h2>Design that converts</h2><p>Our designers create intuitive, accessible interfaces backed by research — wireframes, prototypes and polished UI that users love.</p>",
    benefits: [{"title":"Research driven","description":"Design decisions based on real users."},{"title":"Interactive prototypes","description":"Test flows before writing code."},{"title":"Design systems","description":"Consistent, reusable component libraries."}] as never,
    process: [], faqs: [], category_id: null, status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "s7", title: "SEO Services", slug: "seo-services", icon: "seo",
    summary: "Technical SEO, content strategy and link building to grow organic traffic.",
    content: "<h2>Get found on Google</h2><p>We improve technical health, on-page optimisation, content and authority to grow your organic traffic and rankings sustainably.</p>",
    benefits: [{"title":"Technical SEO","description":"Speed, crawlability and schema fixes."},{"title":"Content strategy","description":"Keyword research and editorial planning."},{"title":"Transparent reports","description":"Clear dashboards of rankings and traffic."}] as never,
    process: [], faqs: [], category_id: null, status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "s8", title: "Website Maintenance", slug: "website-maintenance", icon: "maintenance",
    summary: "Security updates, backups, monitoring and support to keep your site healthy.",
    content: "<h2>Keep your site healthy</h2><p>Proactive maintenance plans cover updates, backups, uptime monitoring, security scans and priority support.</p>",
    benefits: [{"title":"Always secure","description":"Patches and security scans on schedule."},{"title":"Uptime monitoring","description":"We catch problems before visitors do."},{"title":"Peace of mind","description":"Priority support when you need it."}] as never,
    process: [], faqs: [], category_id: null, status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "s9", title: "AI Solutions", slug: "ai-solutions", icon: "ai",
    summary: "Chatbots, automation and AI features that save time and unlock new capabilities.",
    content: "<h2>Practical AI for business</h2><p>We integrate AI where it adds real value — support chatbots, content tools, document processing and workflow automation.</p>",
    benefits: [{"title":"Support chatbots","description":"24/7 answers trained on your content."},{"title":"Automation","description":"Cut manual work with smart workflows."},{"title":"Responsible AI","description":"Privacy-first, auditable implementations."}] as never,
    process: [], faqs: [], category_id: null, status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
];

export const DEMO_PROJECTS: Project[] = [
  {
    id: "p1", title: "NexTrade Finance Dashboard", slug: "nextrade-finance-dashboard", client_name: "NexTrade", industry: "Fintech",
    summary: "A real-time analytics dashboard for a fintech startup, built with Next.js and Supabase.",
    content: "<p>Designed and built a full analytics platform with live charts, role-based access and edge deployment.</p>",
    technologies: ["Next.js", "Supabase", "Tailwind CSS", "Recharts"] as never,
    images: [] as never, cover_image: null, project_url: "https://example.com", category_id: null,
    status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "p2", title: "Bloom & Co Ecommerce", slug: "bloom-co-ecommerce", client_name: "Bloom & Co", industry: "Retail",
    summary: "A headless ecommerce store with a fast, conversion-focused shopping experience.",
    content: "<p>Built a headless storefront with Stripe payments, inventory sync and sub-second page loads.</p>",
    technologies: ["Next.js", "Stripe", "Supabase"] as never,
    images: [] as never, cover_image: null, project_url: null, category_id: null,
    status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "p3", title: "UrbanEats Restaurant Site", slug: "urbaneats-restaurant", client_name: "UrbanEats", industry: "Hospitality",
    summary: "A vibrant, brand-led website for a restaurant group with online reservations.",
    content: "<p>A fast, accessible marketing site with reservations, menus and SEO in six cities.</p>",
    technologies: ["Next.js", "Sanity"] as never,
    images: [] as never, cover_image: null, project_url: null, category_id: null,
    status: "published", featured: true,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "p4", title: "FitTrack Mobile App", slug: "fittrack-mobile-app", client_name: "FitTrack", industry: "Health & Fitness",
    summary: "A cross-platform fitness tracking app with social challenges and analytics.",
    content: "<p>React Native app with offline-first data sync, push notifications and wearable integration.</p>",
    technologies: ["React Native", "Supabase", "Expo"] as never,
    images: [] as never, cover_image: null, project_url: null, category_id: null,
    status: "published", featured: false,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "p5", title: "LawBridge Firm Website", slug: "lawbridge-firm", client_name: "LawBridge", industry: "Legal",
    summary: "A professional, SEO-optimised website for a law firm with practice area pages.",
    content: "<p>Designed a trusted, conversion-focused site with case study pages and lead forms.</p>",
    technologies: ["WordPress", "Elementor", "Rank Math"] as never,
    images: [] as never, cover_image: null, project_url: null, category_id: null,
    status: "published", featured: false,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "p6", title: "BrandKit Rebrand", slug: "brandkit-rebrand", client_name: "BrandKit", industry: "Branding",
    summary: "Complete visual identity — logo, colour system, typography and social templates.",
    content: "<p>A full brand refresh including guidelines, social media kits and stationery.</p>",
    technologies: ["Figma", "Illustrator"] as never,
    images: [] as never, cover_image: null, project_url: null, category_id: null,
    status: "published", featured: false,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
];

export const DEMO_POSTS: Post[] = [
  {
    id: "b1", title: "Why Next.js is the Best Framework for SEO in 2026", slug: "why-nextjs-best-framework-seo-2026",
    excerpt: "Server-side rendering, structured data and edge deployment make Next.js a powerhouse for search rankings. Here’s how we use it.",
    content: "<h2>The SEO advantage of Next.js</h2><p>Search engines love fast, crawlable pages. With Next.js, every page ships as HTML — no JavaScript required to see content. That alone puts you ahead of most single-page apps.</p><h3>Key benefits</h3><ul><li>SSR and SSG for instant content</li><li>Automatic sitemaps and metadata</li><li>Edge caching for global speed</li></ul>",
    cover_image: null, author_id: null, category_id: null, reading_time: 4,
    status: "published", published_at: now,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "b2", title: "10 On-Page SEO Mistakes That Kill Your Rankings", slug: "10-on-page-seo-mistakes-kill-rankings",
    excerpt: "Avoid these common on-page SEO mistakes and give your pages the best chance of ranking in 2026.",
    content: "<h2>Common on-page SEO mistakes</h2><p>Duplicate titles, missing alt text, slow Core Web Vitals, keyword cannibalisation — we see the same issues on almost every audit. Here’s what to fix first.</p>",
    cover_image: null, author_id: null, category_id: null, reading_time: 6,
    status: "published", published_at: now,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "b3", title: "Choosing the Right Domain & Hosting for Your Business", slug: "choosing-right-domain-hosting-business",
    excerpt: "Your domain and hosting set the foundation for performance, security and trust. A practical guide.",
    content: "<h2>Foundation first</h2><p>A good domain is short, brandable and .com if possible. Hosting should match your traffic and region. Here’s how to choose.</p>",
    cover_image: null, author_id: null, category_id: null, reading_time: 5,
    status: "published", published_at: now,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "b4", title: "AI in Small Business: Where It Actually Pays Off", slug: "ai-small-business-where-it-pays-off",
    excerpt: "Chatbots, content, document processing — where AI delivers real ROI for small businesses today.",
    content: "<h2>Practical AI wins</h2><p>Not every AI trend is worth chasing. Support chatbots, automated replies and document processing deliver measurable savings right now.</p>",
    cover_image: null, author_id: null, category_id: null, reading_time: 4,
    status: "published", published_at: now,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "b5", title: "Ecommerce UX: 7 Tweaks That Lift Conversion", slug: "ecommerce-ux-7-tweaks-lift-conversion",
    excerpt: "Small UX changes — product photos, checkout length, trust signals — can meaningfully raise conversion rates.",
    content: "<h2>Conversion-focused UX</h2><p>Speed up checkout, show real reviews, add sticky add-to-cart and reduce form fields. These seven tweaks routinely lift conversion by double digits.</p>",
    cover_image: null, author_id: null, category_id: null, reading_time: 5,
    status: "published", published_at: now,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
  {
    id: "b6", title: "How to Plan a Website Redesign Without Losing SEO", slug: "plan-website-redesign-without-losing-seo",
    excerpt: "A redesign is a great opportunity — and a risk. Keep your rankings with this migration checklist.",
    content: "<h2>Redesign without ranking loss</h2><p>Map old URLs, keep redirects, preserve content and monitor after launch. A structured plan avoids the classic redesign ranking cliff.</p>",
    cover_image: null, author_id: null, category_id: null, reading_time: 6,
    status: "published", published_at: now,
    meta_title: null, meta_description: null, canonical_url: null, og_title: null, og_description: null, og_image: null,
    created_at: now, updated_at: now,
  },
];

export const DEMO_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1", client_name: "Ahmed Raza", company: "NexTrade", role: "CEO",
    quote: "Marwat Tech delivered our dashboard ahead of schedule. The code is clean, fast and the team communicates brilliantly.",
    rating: 5, avatar_url: null, featured: true, status: "published", sort_order: 1, created_at: now,
  },
  {
    id: "t2", client_name: "Sarah Mitchell", company: "Bloom & Co", role: "Founder",
    quote: "Our online store loads instantly and conversions are up 40%. They truly understand ecommerce.",
    rating: 5, avatar_url: null, featured: true, status: "published", sort_order: 2, created_at: now,
  },
  {
    id: "t3", client_name: "David Chen", company: "FitTrack", role: "Product Manager",
    quote: "Professional, responsive and technically excellent. The app was approved by both app stores on the first submission.",
    rating: 5, avatar_url: null, featured: true, status: "published", sort_order: 3, created_at: now,
  },
  {
    id: "t4", client_name: "Fatima Khan", company: "UrbanEats", role: "Marketing Director",
    quote: "SEO traffic tripled within four months. The redesign looks stunning and our guests love it.",
    rating: 5, avatar_url: null, featured: false, status: "published", sort_order: 4, created_at: now,
  },
  {
    id: "t5", client_name: "James Okafor", company: "LawBridge", role: "Partner",
    quote: "From mockup to launch in three weeks. A smooth process with a website that brings us real leads.",
    rating: 5, avatar_url: null, featured: false, status: "published", sort_order: 5, created_at: now,
  },
  {
    id: "t6", client_name: "Ayesha Malik", company: "BrandKit", role: "Owner",
    quote: "The free mockup impressed us immediately — we knew we were in good hands. Highly recommended.",
    rating: 5, avatar_url: null, featured: false, status: "published", sort_order: 6, created_at: now,
  },
];

export const DEMO_CAREERS: Career[] = [
  {
    id: "c1", title: "Senior Next.js Developer", slug: "senior-nextjs-developer", department: "Engineering",
    location: "Remote", job_type: "Full-time", salary_range: "$3,000 – $5,000 / month",
    description: "<p>We are looking for a senior Next.js developer to lead client projects. You will own architecture, mentor juniors and deliver production-grade apps.</p>",
    requirements: "<ul><li>5+ years of React/Next.js experience</li><li>Strong TypeScript and SQL skills</li><li>Experience with Supabase or similar</li></ul>",
    status: "published", created_at: now, updated_at: now,
  },
  {
    id: "c2", title: "UI/UX Designer", slug: "ui-ux-designer", department: "Design",
    location: "Bannu / Remote", job_type: "Full-time", salary_range: "$1,500 – $2,500 / month",
    description: "<p>We are hiring a designer who sweats the details — wireframes to polished UI, always thinking about users and conversion.</p>",
    requirements: "<ul><li>3+ years of product design experience</li><li>Strong Figma portfolio</li><li>Understanding of accessibility</li></ul>",
    status: "published", created_at: now, updated_at: now,
  },
  {
    id: "c3", title: "SEO Specialist", slug: "seo-specialist", department: "Marketing",
    location: "Remote", job_type: "Contract", salary_range: "Negotiable",
    description: "<p>You will run technical and content SEO for client sites, from audits to keyword strategy and reporting.</p>",
    requirements: "<ul><li>Hands-on technical SEO experience</li><li>Analytics and search console expertise</li><li>Strong written English</li></ul>",
    status: "published", created_at: now, updated_at: now,
  },
];
