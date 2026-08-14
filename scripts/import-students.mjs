// Bulk-import student emails into course_subscribers with dedup + validation.
// Reads scripts/students-emails.txt (one email per line), normalizes,
// dedupes case-insensitively, validates, and writes import SQL + a report.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "scripts");
const raw = readFileSync(join(DIR, "students-emails.txt"), "utf8");

const lines = raw
  .split(/\r?\n/)
  .map((l) => l.trim().toLowerCase())
  .filter(Boolean);

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

const seen = new Set();
const duplicates = [];
const invalid = [];
const unique = [];

for (const line of lines) {
  if (!EMAIL_RE.test(line)) {
    invalid.push(line);
    continue;
  }
  if (seen.has(line)) {
    duplicates.push(line);
    continue;
  }
  seen.add(line);
  unique.push(line);
}

// Build a single INSERT ... ON CONFLICT (email) DO UPDATE (re-subscribe).
const values = unique.map((e) => `('${e.replace(/'/g, "''")}', 'subscribed')`).join(",\n  ");
const sql = `-- Auto-generated student import (${new Date().toISOString()})
insert into public.course_subscribers (email, status)
values
  ${values}
on conflict (email) do update set status = 'subscribed', unsubscribed_at = null;
`;

writeFileSync(join(DIR, "_import-students.sql"), sql);

const report = {
  totalLines: lines.length,
  uniqueValid: unique.length,
  duplicatesRemoved: duplicates.length,
  invalidDropped: invalid.length,
  duplicateSample: [...new Set(duplicates)].slice(0, 10),
  invalidSample: [...new Set(invalid)].slice(0, 20),
};
writeFileSync(join(DIR, "_import-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log("SQL written to scripts/_import-students.sql");
