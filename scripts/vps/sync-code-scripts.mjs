#!/usr/bin/env node
/**
 * Code Scripts sync runner (runs on the VPS via cron, NOT in the Worker).
 *
 * Every 48h (or on a manual "Sync now" request) it:
 *   1. fetches the source site's sitemap and finds NEW post URLs
 *   2. scrapes each post (title, content, category, images, version, download link)
 *   3. downloads the image, watermarks it with the square logo, uploads to R2
 *      (or Supabase storage as a fallback)
 *   4. rewrites/expands the content for SEO via the DeepSeek API
 *   5. inserts into `code_scripts` (auto-published) + logs to `code_script_syncs`
 *
 * Self-contained: run it from a dedicated folder that has the deps installed:
 *   npm i cheerio sharp @aws-sdk/client-s3 @supabase/supabase-js
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEEPSEEK_API_KEY, WATERMARK,
 *      SOURCE_SITE, R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *      R2_PUBLIC_BASE, MAX_PER_RUN
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const env = process.env;
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;
const WATERMARK = env.WATERMARK;
const SOURCE_SITE = (env.SOURCE_SITE || "https://nullphpscript.com").replace(/\/$/, "");
const R2_ENDPOINT = (env.R2_ENDPOINT || "").replace(/\/[^/]*$/, ""); // strip trailing bucket path
const R2_BUCKET = env.R2_BUCKET || "marwattech-media";
const R2_ACCESS_KEY = env.R2_ACCESS_KEY_ID || "";
const R2_SECRET = env.R2_SECRET_ACCESS_KEY || "";
const R2_PUBLIC_BASE = (env.R2_PUBLIC_BASE || "https://media.marwattech.com").replace(/\/$/, "");
const MAX_PER_RUN = Number(env.MAX_PER_RUN || 15);
const MIN_INTERVAL_MS = 48 * 60 * 60 * 1000;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const CATEGORY_MAP = [
  [/php/i, "php-scripts"],
  [/plugin/i, "wordpress-plugins"],
  [/theme/i, "wordpress-themes"],
  [/laravel/i, "laravel"],
  [/saas|web app|webapp|application/i, "saas-apps"],
  [/javascript|react|next\.?js|node/i, "javascript"],
  [/ecom|shop|cart|marketplace/i, "ecommerce"],
  [/tool|utility|snippet/i, "tools"],
];

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueSlug(title, set) {
  let s = slugify(title) || "script";
  let candidate = s;
  let i = 2;
  while (set.has(candidate)) candidate = `${s}-${i++}`;
  return candidate;
}

function mapCategory(raw) {
  const t = raw || "";
  for (const [re, slug] of CATEGORY_MAP) if (re.test(t)) return slug;
  return slugify(t) || "tools";
}

function extractVersion(text) {
  if (!text) return null;
  const m = String(text).match(/ver(?:sion)?[\s:.-]*v?(\d+(?:\.\d+)+)/i);
  if (m) return m[1];
  const m2 = String(text).match(/\bv(\d+(?:\.\d+)+)\b/i);
  return m2 ? m2[1] : null;
}

function plainText(html) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function buildExcerpt(html, max = 160) {
  const t = plainText(html);
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
}

/* ── Sitemap ─────────────────────────────────────────────────────────── */
async function fetchSitemapUrls() {
  const out = [];
  const stack = [`${SOURCE_SITE}/sitemap.xml`];
  const seen = new Set();
  while (stack.length) {
    const url = stack.pop();
    if (seen.has(url)) continue;
    seen.add(url);
    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    } catch {
      continue;
    }
    if (!res.ok) continue;
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi)].map((m) => m[1].trim());
    for (const loc of locs) {
      if (!loc) continue;
      if (/\.xml$/i.test(loc) && !seen.has(loc)) stack.push(loc);
      else out.push(loc);
    }
  }
  return out;
}

/* ── Scrape ──────────────────────────────────────────────────────────── */
async function scrape(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("h1").first().text().trim();
  const image =
    $('meta[property="og:image"]').attr("content")?.trim() ||
    $("article img").first().attr("src") ||
    $(".entry-content img").first().attr("src") ||
    $(".post-content img").first().attr("src") ||
    null;

  const contentSel = $("article .entry-content, .entry-content, .post-content, article").first();
  const content = contentSel.length ? (contentSel.html() || "") : "";

  const category =
    $('a[rel="category tag"]').last().text().trim() ||
    $(".breadcrumb a").last().text().trim() ||
    $(".cat-links a").last().text().trim() ||
    "";

  let downloadUrl = null;
  let version = null;
  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    const looksDownload =
      /download/i.test(href) || /\.(zip|rar|7z|tar\.gz|gz)$/i.test(href) || /download/i.test(text);
    if (!looksDownload) return;
    if (!downloadUrl) downloadUrl = href;
    const v = extractVersion(text) || extractVersion(href);
    if (v && !version) version = v;
  });
  if (!version) version = extractVersion(content);

  return { title, image, content, category: category || null, categorySlug: mapCategory(category), downloadUrl, version };
}

/* ── Image → watermark → upload ──────────────────────────────────────── */
async function processAndUploadImage(src, slug) {
  if (!src) return null;
  let res;
  try {
    res = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0" } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const input = Buffer.from(await res.arrayBuffer());

  let out = sharp(input).rotate();
  const meta = await out.metadata();
  if (meta.width && meta.width > 1280) out = out.resize({ width: 1280, withoutEnlargement: true });
  let pipeline = out.webp({ quality: 82 });

  if (WATERMARK) {
    try {
      const logo = await sharp(WATERMARK)
        .resize({ width: 140, withoutEnlargement: true })
        .modulate({ opacity: 0.9 })
        .png()
        .toBuffer();
      pipeline = pipeline.composite([{ input: logo, gravity: "southeast", opacity: 0.9 }]);
    } catch {
      // watermark missing — skip
    }
  }
  const webp = await pipeline.toBuffer();

  const key = `code-scripts/covers/${slug}.webp`;
  if (R2_ENDPOINT && R2_ACCESS_KEY && R2_SECRET) {
    const s3 = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET },
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: webp,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return `${R2_PUBLIC_BASE}/${key}`;
  }
  // Fallback: Supabase storage
  const { error } = await db.storage.from("media").upload(key, webp, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) throw error;
  return db.storage.from("media").getPublicUrl(key).data.publicUrl;
}

/* ── DeepSeek SEO rewrite ────────────────────────────────────────────── */
async function rewriteWithDeepSeek(input) {
  if (!DEEPSEEK_API_KEY) return {};
  const system = `You are an expert SEO content writer for a "Code Scripts" marketplace.
Rewrite and expand the given product into unique, high-quality, keyword-rich content.
Return STRICT JSON only, no markdown fences:
{
  "title": "SEO-optimised product title (keep the product name + a benefit)",
  "seoTitle": "<=60 char title tag",
  "seoDescription": "<=155 char meta description",
  "excerpt": "one-sentence summary (<=160 chars)",
  "contentHtml": "unique content as HTML with <h2>/<h3> headings and <p> paragraphs, feature bullet lists, and a short intro. Do NOT invent prices or licenses. ~300-600 words.",
  "faqs": [{"q": "question", "a": "concise answer"}]
}
Keep the version number if present.`;
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return JSON.parse(content.replace(/```json|```/gi, "").trim());
  } catch (e) {
    console.error("DeepSeek failed:", e.message);
    return {};
  }
}

/* ── Main ────────────────────────────────────────────────────────────── */
async function main() {
  const { data: pending } = await db
    .from("code_script_sync_requests")
    .select("id")
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();
  const force = !!pending;

  if (!force) {
    const { data: last } = await db
      .from("code_script_syncs")
      .select("ran_at")
      .order("ran_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastRun = last?.ran_at ? new Date(last.ran_at).getTime() : 0;
    if (Date.now() - lastRun < MIN_INTERVAL_MS) {
      console.log("Skipping: last sync < 48h ago");
      return;
    }
  }

  const sitemapUrls = await fetchSitemapUrls();
  const postUrls = [...new Set(sitemapUrls.filter((u) => /\/post\//.test(u)))];
  if (!postUrls.length) {
    console.log("No post URLs found in sitemap (found " + sitemapUrls.length + " urls)");
    await logRun(sitemapUrls.length, 0, 0, 0, "no-post-urls");
    if (pending?.id) await doneRequest(pending.id);
    return;
  }

  const { data: existing } = await db.from("code_scripts").select("source_url").limit(20000);
  const seen = new Set((existing ?? []).map((r) => r.source_url));
  const fresh = postUrls.filter((u) => !seen.has(u)).slice(0, MAX_PER_RUN);

  const { data: existingSlugs } = await db.from("code_scripts").select("slug").limit(20000);
  const slugSet = new Set((existingSlugs ?? []).map((r) => r.slug));

  let imported = 0;
  let failed = 0;
  const errors = [];

  for (const url of fresh) {
    try {
      const item = await scrape(url);
      if (!item.title) throw new Error("No title found");
      const slug = uniqueSlug(item.title, slugSet);
      const cover = item.image ? await processAndUploadImage(item.image, slug) : null;
      const ai = await rewriteWithDeepSeek({
        title: item.title,
        category: item.category,
        version: item.version,
        contentHtml: item.content,
        url,
      });
      const content = ai.contentHtml || item.content;
      const faqs = Array.isArray(ai.faqs) ? ai.faqs.slice(0, 6) : [];
      const { error } = await db.from("code_scripts").insert({
        source_url: url,
        title: ai.title || item.title,
        slug,
        category: item.categorySlug,
        version: item.version,
        content,
        excerpt: ai.excerpt || buildExcerpt(content),
        cover_image: cover,
        source_image: item.image,
        download_url: item.downloadUrl,
        source_download_url: item.downloadUrl,
        seo_title: ai.seoTitle || null,
        seo_description: ai.seoDescription || null,
        faqs,
        status: "published",
        last_synced_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      imported++;
      slugSet.add(slug);
      console.log(`✓ ${item.title} (v${item.version ?? "?"})`);
    } catch (e) {
      failed++;
      errors.push(e.message);
      console.error(`✗ ${url} — ${e.message}`);
    }
  }

  await logRun(sitemapUrls.length, fresh.length, imported, failed, errors.join(" | ").slice(0, 2000));
  if (pending?.id) await doneRequest(pending.id);
  console.log(`Done: sitemap=${sitemapUrls.length} posts=${postUrls.length} new=${fresh.length} imported=${imported} failed=${failed}`);
}

async function logRun(sitemapUrls, newFound, imported, failed, error) {
  await db.from("code_script_syncs").insert({
    sitemap_urls: sitemapUrls,
    new_found: newFound,
    imported,
    failed,
    error: error || null,
  });
}

async function doneRequest(id) {
  await db
    .from("code_script_sync_requests")
    .update({ status: "done", processed_at: new Date().toISOString() })
    .eq("id", id);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
