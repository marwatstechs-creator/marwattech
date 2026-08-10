# Marwat Tech — Corporate Website + Admin CMS

A modern, SEO‑optimized corporate website with an integrated admin dashboard and CMS, built on **Next.js 15** (App Router), **Supabase** and deployed on **Cloudflare**.

---

## ✨ Features

**Public site**
- Home, About, Services (9 detailed service pages), Portfolio (with category filters + case studies), Testimonials, Careers (with job applications), Blog (pagination, categories, search), Contact, Technical Support, Free Mockup, and legal pages.
- SEO: per‑entity meta title/description/canonical/OG fields, auto‑generated `sitemap.xml`, `robots.txt`, JSON‑LD structured data (Article, BreadcrumbList, Organization), dynamic Open Graph image, breadcrumbs.
- Forms: contact, support ticket, free mockup and job application → stored in Supabase + email notification.
- Analytics: Google Tag Manager, Google Analytics, Microsoft Clarity and PostHog (gated by env vars).

**Admin dashboard** (`/admin`)
- Role‑based access: **super_admin**, **editor**, **support**.
- Full CRUD for Services, Portfolio, Blog (rich‑text WYSIWYG editor, tags, categories, featured image, SEO fields), Testimonials, Careers.
- Messages inbox (contact / support / mockups) with status + internal notes; job applications pipeline.
- Media library (Supabase Storage uploads), site settings, user/role management.
- Activity logging and ISR revalidation after content changes.

---

## 🧰 Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, RSC, Server Actions, ISR) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Icons | Huge Icons (`@hugeicons/react` + `@hugeicons/core-free-icons`) |
| Animation | Framer Motion |
| Backend | Supabase (Postgres + Auth + Storage) |
| Email | SMTP (cPanel) or Resend (HTTP) |
| Hosting | Cloudflare Workers/Pages via `@opennextjs/cloudflare` |

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase project URL, anon key and service role key (Supabase Dashboard → Settings → API).

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql) — this creates all tables, triggers, RLS policies and the `media` storage bucket.
3. Seed the admin user, categories and default settings:

```bash
node scripts/seed.mjs
```

> The seed script creates the admin account from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (default `admin@marwattech.com` / `ChangeMe123!`). **Change the password after first login.**

### 4. Run locally

```bash
npm run dev        # http://localhost:3000
```

Admin: `http://localhost:3000/admin/login`

> Without Supabase credentials the site runs on **demo content** (see `lib/demo.ts`) so you can preview the UI immediately. Connect Supabase and content switches to the database.

---

## 📧 Email Notifications

Contact / support / mockup / application forms write to the DB and send an email.

- **Option A — SMTP (cPanel):** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`.
- **Option B — Resend (edge‑friendly):** set `RESEND_API_KEY` (overrides SMTP).

Recipients come from the `form_notify_email` site setting (fallback: `FORM_NOTIFY_EMAIL` env var), editable under **Admin → Settings**.

---

## 📊 Analytics

All analytics IDs are read from env vars (or **Admin → Settings**) and loaded via `components/analytics/scripts.tsx`:

- `NEXT_PUBLIC_GTM_ID` — Google Tag Manager
- `NEXT_PUBLIC_GA_ID` — Google Analytics (only when GTM is not set)
- `NEXT_PUBLIC_CLARITY_ID` — Microsoft Clarity
- `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` — PostHog

Form submissions and CTA clicks are tracked with `trackEvent` (`lib/analytics.ts`).

---

## 🔐 Admin Roles

| Role | Permissions |
| --- | --- |
| `super_admin` | Everything, including site settings + user/role management |
| `editor` | Manage services, portfolio, blog, testimonials, careers, media |
| `support` | View/manage messages, support tickets, mockup requests, applications |

Roles are enforced by server‑side guards (`lib/auth.ts`, `lib/actions/admin/helpers.ts`) **and** Supabase Row Level Security.

---

## ☁️ Deploy to Cloudflare

This project uses [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) to run Next.js (server actions, ISR, middleware) on the Workers runtime.

1. **Create a KV namespace** (used for ISR cache):

```bash
npx wrangler kv namespace create NEXT_CACHE
```

2. Paste the returned KV id into `wrangler.jsonc` → `kv_namespaces[0].id`.

3. Set secrets (never commit them):

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put SMTP_PASS
# … plus any other secret env vars
```

4. Build & preview locally, then deploy:

```bash
npm run preview     # opennextjs-cloudflare build + preview
npm run deploy      # opennextjs-cloudflare build + deploy
```

> Public `NEXT_PUBLIC_*` values in `wrangler.jsonc` are used at runtime; they are also inlined at build time, so keep them in sync.
>
> **Email note:** `nodemailer` (SMTP) requires Node.js compatibility — enabled via `nodejs_compat` in `wrangler.jsonc`. For a fully edge‑native setup, set `RESEND_API_KEY` and the email route uses the Resend HTTP API instead.

### Alternative: any Node host (Vercel / Railway / cPanel Node)

The app is standard Next.js — `npm run build && npm start` works on any Node 20+ host. On Vercel set the same env vars (add `SUPABASE_SERVICE_ROLE_KEY` as a server‑only env).

---

## 📁 Project Structure

```
app/
  (marketing)/          # public site (home, about, services, portfolio, blog, etc.)
  admin/(auth)/         # /admin/login
  admin/(dashboard)/    # protected admin area (role-gated layout)
  layout.tsx            # root layout (fonts, providers, analytics)
  sitemap.ts, robots.ts # SEO generation
  opengraph-image.tsx   # dynamic OG image
components/
  ui/                   # shadcn/ui primitives
  marketing/            # navbar, footer, hero, cards, forms
  admin/                # admin shell, CRUD forms, tables
  forms/                # public forms (contact, support, mockup, careers)
lib/
  supabase/             # client / server / admin / middleware clients
  db/content.ts         # typed public queries
  actions/              # server actions (public forms + admin CRUD)
  email.ts              # SMTP / Resend notifications
  seo.ts, icons.ts, constants.ts, validations.ts, demo.ts
supabase/
  schema.sql            # tables, RLS, storage policies
types/database.ts       # hand-written Supabase types
scripts/seed.mjs        # first admin + default content setup
```

---

## 🧪 Scripts

```bash
npm run dev        # start dev server (Turbopack)
npm run build      # production build
npm run start      # run production build locally
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run preview    # OpenNext Cloudflare preview
npm run deploy     # deploy to Cloudflare
```

---

## 🔒 Security Notes

- All admin mutations validate input with **Zod** and check roles server‑side.
- Rich‑text HTML from the CMS is **sanitized** before rendering (`lib/sanitize.ts`, DOMPurify).
- Row Level Security is enabled on every table (see `supabase/schema.sql`) — anonymous users can only read published content and insert form submissions.
- Supabase service‑role key is **server‑only** (`lib/supabase/admin.ts`).

---

## 📝 License

Private project — © Marwat Tech. All rights reserved.
