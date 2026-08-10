#!/usr/bin/env node
/**
 * Seed script — creates the first super admin user, default categories and
 * site settings. Run after applying supabase/schema.sql:
 *
 *   cp .env.example .env.local   # fill in real values
 *   node scripts/seed.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// Tiny .env.local loader (no dependency)
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
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@marwattech.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

if (!url || !serviceKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("🌱 Seeding Marwat Tech…");

  // 1. Admin user + profile
  let userId;
  const { data: existing } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const found = existing?.users.find((u) => u.email === adminEmail.toLowerCase());
  if (found) {
    userId = found.id;
    console.log("ℹ️  Admin user already exists.");
  } else {
    const { data, error } = await sb.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: "Marwat Tech Admin" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`✅ Created admin user ${adminEmail}`);
  }

  const { data: profile, error: profileError } = await sb
    .from("profiles")
    .upsert({ id: userId, full_name: "Marwat Tech Admin", role: "super_admin" })
    .select("id, role")
    .single();
  if (profileError) throw profileError;
  console.log(`✅ Profile role: ${profile.role}`);

  // 2. Service categories
  const serviceCategories = [
    { name: "Development", slug: "development", sort_order: 1 },
    { name: "Design", slug: "design", sort_order: 2 },
    { name: "Marketing & SEO", slug: "marketing-seo", sort_order: 3 },
    { name: "Maintenance & Support", slug: "maintenance-support", sort_order: 4 },
  ];
  for (const c of serviceCategories) {
    await sb.from("service_categories").upsert(c, { onConflict: "slug" });
  }
  console.log(`✅ Seeded ${serviceCategories.length} service categories`);

  // 3. Portfolio categories
  const portfolioCategories = [
    { name: "Web Design", slug: "web-design", sort_order: 1 },
    { name: "Web Development", slug: "web-development", sort_order: 2 },
    { name: "Graphic Design", slug: "graphic-design", sort_order: 3 },
    { name: "Social Media", slug: "social-media", sort_order: 4 },
    { name: "SEO", slug: "seo", sort_order: 5 },
  ];
  for (const c of portfolioCategories) {
    await sb.from("portfolio_categories").upsert(c, { onConflict: "slug" });
  }
  console.log(`✅ Seeded ${portfolioCategories.length} portfolio categories`);

  // 4. Blog categories
  const blogCategories = [
    { name: "Web Design & Development", slug: "web-design-development", description: "Building and designing websites." },
    { name: "SEO & Marketing", slug: "seo-marketing", description: "Grow organic traffic and conversions." },
    { name: "Business Strategy", slug: "business-strategy", description: "Digital strategy for business growth." },
    { name: "Domain & Hosting", slug: "domain-hosting", description: "Domains, hosting and infrastructure." },
    { name: "Tutorials & Guides", slug: "tutorials-guides", description: "Step-by-step how-to guides." },
    { name: "AI & Future Tech", slug: "ai-future-tech", description: "Artificial intelligence and emerging tech." },
  ];
  for (const c of blogCategories) {
    await sb.from("blog_categories").upsert(c, { onConflict: "slug" });
  }
  console.log(`✅ Seeded ${blogCategories.length} blog categories`);

  // 5. Site settings defaults
  const settings = [
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
  for (const [key, value] of settings) {
    await sb.from("site_settings").upsert({ key, value }, { onConflict: "key" });
  }
  console.log(`✅ Seeded ${settings.length} site settings`);

  console.log("🎉 Done. You can now log in at /admin/login");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message ?? err);
  process.exit(1);
});
