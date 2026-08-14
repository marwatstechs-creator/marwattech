// One-off generator: renders branded OG images for /free-courses and
// /promo-codes into public/ as static PNGs (avoids bundling next/og's WASM
// into the 3 MiB-limited Worker). Run: node scripts/gen-og.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const React = require("react");
const { ImageResponse } = require("next/og");
const fs = require("fs");
const path = require("path");

// Load env from .env.local
const env = {};
try {
  const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/);
    if (m && m[1] && !env[m[1]]) env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase-api.marwattech.com";
const SUPABASE_ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const h = React.createElement;

function truncate(s, n) {
  return s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;
}

function CourseCardImage({ badge, title, subtitle, countLabel, courses, path, footer }) {
  return h(
    "div",
    { style: { width: 1200, height: 630, display: "flex", flexDirection: "column", backgroundColor: "#5f4fa8", fontFamily: "'Noto Sans'", position: "relative", overflow: "hidden" } },
    h("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(135deg,#7464c6 0%,#8b7dd4 48%,#5f4fa8 100%)" } }),
    h("div", { style: { position: "absolute", top: -150, left: -110, width: 480, height: 480, borderRadius: "50%", background: "rgba(248,198,64,0.28)" } }),
    h("div", { style: { position: "absolute", bottom: -170, right: -90, width: 540, height: 540, borderRadius: "50%", background: "rgba(255,255,255,0.16)" } }),
    h("div", { style: { position: "absolute", top: 190, right: 360, width: 240, height: 240, borderRadius: "50%", background: "rgba(179,166,230,0.55)" } }),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", flex: 1, padding: 52, position: "relative" } },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 14 } },
          h("div", { style: { width: 42, height: 42, borderRadius: 10, background: "#f8c640", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, color: "#111318" } }, "M"),
          h("div", { style: { color: "rgba(255,255,255,0.95)", fontSize: 26, fontWeight: 700 } }, "Marwat Tech")
        ),
        h("div", { style: { color: "rgba(255,255,255,0.75)", fontSize: 22, fontWeight: 600 } }, "marwattech.com")
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", marginTop: 34 } },
        h("span", { style: { alignSelf: "flex-start", background: "#f8c640", color: "#111318", borderRadius: 999, padding: "8px 20px", fontSize: 22, fontWeight: 800 } }, badge),
        h("div", { style: { fontSize: 78, fontWeight: 800, color: "#ffffff", marginTop: 18, lineHeight: 1.02 } }, title),
        h("div", { style: { fontSize: 26, color: "rgba(255,255,255,0.9)", marginTop: 12 } }, subtitle),
        h("div", { style: { fontSize: 24, color: "#f8c640", fontWeight: 800, marginTop: 16 } }, countLabel)
      ),
      h(
        "div",
        { style: { display: "flex", gap: 20, marginTop: 28 } },
        courses.map((c, i) =>
          h(
            "div",
            { key: i, style: { flex: 1, display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 18, padding: 14 } },
            c.image
              ? h("img", { src: c.image, width: 300, height: 150, style: { width: "100%", height: 148, objectFit: "cover", borderRadius: 12, display: "flex" } })
              : h("div", { style: { width: "100%", height: 148, borderRadius: 12, background: "rgba(248,198,64,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 } }, "🎓"),
            h("div", { style: { fontSize: 19, color: "#ffffff", fontWeight: 700, marginTop: 10, lineHeight: 1.25, height: 48, overflow: "hidden" } }, truncate(c.title, 52))
          )
        )
      )
    ),
    h(
      "div",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 52px", background: "rgba(0,0,0,0.18)", position: "relative" } },
      h("div", { style: { fontSize: 20, color: "rgba(255,255,255,0.85)", fontWeight: 600 } }, footer),
      h("div", { style: { fontSize: 21, color: "#f8c640", fontWeight: 800 } }, path)
    )
  );
}

async function toDataUri(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

async function fetchRows(selectors) {
  const query = selectors.map((s) => `&${s}`).join("");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/promo_codes?select=title,image_url,tag${query}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  if (!res.ok) return [];
  return await res.json();
}

async function renderAndSave(element, file) {
  const img = new ImageResponse(element, { width: 1200, height: 630 });
  const buf = await img.arrayBuffer();
  fs.writeFileSync(path.join(process.cwd(), "public", file), Buffer.from(buf));
  console.log("wrote", file, buf.byteLength, "bytes");
}

async function main() {
  const all = await fetchRows(["enabled=eq.true", "order=created_at.desc"]);
  const fullPaid = all.filter((c) => c.tag === "full_paid");
  const freeTop = fullPaid.slice(0, 3);
  const freeCourses = await Promise.all(
    freeTop.map(async (c) => ({ title: c.title, image: await toDataUri(c.image_url) }))
  );

  const promoTop = all.slice(0, 3);
  const promoCourses = await Promise.all(
    promoTop.map(async (c) => ({ title: c.title, image: await toDataUri(c.image_url) }))
  );
  const fullPaidCount = fullPaid.length;

  await renderAndSave(
    CourseCardImage({
      badge: "100% FREE",
      title: "FREE COURSES",
      subtitle: "Grab a 100% OFF Udemy coupon before it expires — no payment needed.",
      countLabel: all.length ? `🔥 ${fullPaid.length} free courses live right now` : "Free courses, refreshed every hour",
      courses: freeCourses.length ? freeCourses : [{ title: "100% OFF Udemy courses" }, { title: "Fresh free coupons every day" }, { title: "Copy a code & start learning free" }],
      path: "marwattech.com/free-courses",
      footer: "100% free · No payment needed · New drops every few hours",
    }),
    "og-free-courses.png"
  );

  await renderAndSave(
    CourseCardImage({
      badge: "LIVE DEALS",
      title: "PROMO CODES & DEALS",
      subtitle: "Latest promos, 100% OFF full-paid offers & discounted learning deals.",
      countLabel: all.length ? `🔥 ${all.length} live deals · ${fullPaidCount} of them 100% OFF` : "Deals refreshed every hour",
      courses: promoCourses.length ? promoCourses : [{ title: "Latest promo codes & deals" }, { title: "100% OFF full-paid courses" }, { title: "Grab the discount before it expires" }],
      path: "marwattech.com/promo-codes",
      footer: "Updated every hour · Codes expire fast — grab them early",
    }),
    "og-promo-codes.png"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
