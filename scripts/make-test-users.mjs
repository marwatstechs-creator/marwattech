#!/usr/bin/env node
// Creates (or ensures) test users for dashboard testing, then deletes them when passed --cleanup
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
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) { console.error("missing env"); process.exit(1); }

const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const USERS = [
  { email: "testadmin@marwattech.test", password: "TestPass123!", full_name: "Test Admin", role: "super_admin" },
  { email: "testclient@marwattech.test", password: "TestPass123!", full_name: "Test Client", role: "client" },
];

async function main() {
  const cleanup = process.argv.includes("--cleanup");
  for (const u of USERS) {
    const { data: existing } = await sb.auth.admin.listUsers({ perPage: 1000 });
    const found = existing?.users.find((x) => x.email === u.email);
    if (cleanup) {
      if (found) {
        await sb.auth.admin.deleteUser(found.id);
        await sb.from("profiles").delete().eq("id", found.id);
        console.log(`🗑  deleted ${u.email}`);
      }
      continue;
    }
    let id = found?.id;
    if (!id) {
      const r = await sb.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true, user_metadata: { full_name: u.full_name } });
      if (r.error) throw r.error;
      id = r.data.user.id;
      console.log(`✅ created ${u.email} (${u.role})`);
    } else {
      console.log(`ℹ️  exists ${u.email} (${u.role})`);
    }
    await sb.from("profiles").upsert({ id, full_name: u.full_name, role: u.role }, { onConflict: "id" });
    console.log(`   profile role set: ${u.role}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
