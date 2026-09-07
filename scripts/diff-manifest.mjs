// Proof harness: compares a saved baseline manifest against the current one,
// field by field, and reports EXACTLY what changed.
//
// Used as a gate after every content-pipeline change. The rule for a
// refactor that is supposed to be behavior-preserving is: zero differences.
//
//   node scripts/diff-manifest.mjs <baseline.json>
//
// Exits 0 when identical, 1 when anything differs.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const CURRENT = fileURLToPath(new URL("../content/_manifest.json", import.meta.url));
const baselinePath = process.argv[2];

if (!baselinePath) {
  console.error("usage: node scripts/diff-manifest.mjs <baseline.json>");
  process.exit(2);
}

const [baseRaw, curRaw] = await Promise.all([
  readFile(baselinePath, "utf8"),
  readFile(CURRENT, "utf8"),
]);

const base = JSON.parse(baseRaw).projects ?? [];
const cur = JSON.parse(curRaw).projects ?? [];

const bySlug = (arr) => new Map(arr.map((p) => [p.slug, p]));
const B = bySlug(base);
const C = bySlug(cur);

const diffs = [];

for (const slug of new Set([...B.keys(), ...C.keys()])) {
  const b = B.get(slug);
  const c = C.get(slug);
  if (!b) { diffs.push(`+ PROJECT ADDED   ${slug}`); continue; }
  if (!c) { diffs.push(`- PROJECT REMOVED ${slug}`); continue; }

  for (const key of new Set([...Object.keys(b), ...Object.keys(c)])) {
    if (key === "images" || key === "videos") continue;
    const bv = JSON.stringify(b[key]);
    const cv = JSON.stringify(c[key]);
    if (bv !== cv) diffs.push(`~ ${slug}.${key}\n    was: ${bv}\n    now: ${cv}`);
  }

  for (const list of ["images", "videos"]) {
    const bl = b[list] ?? [];
    const cl = c[list] ?? [];
    if (bl.length !== cl.length) {
      diffs.push(`~ ${slug}.${list}.length  was: ${bl.length}  now: ${cl.length}`);
      continue;
    }
    bl.forEach((bi, i) => {
      const ci = cl[i];
      for (const key of new Set([...Object.keys(bi), ...Object.keys(ci)])) {
        const bv = JSON.stringify(bi[key]);
        const cv = JSON.stringify(ci[key]);
        if (bv !== cv) diffs.push(`~ ${slug}.${list}[${i}].${key}\n    was: ${bv}\n    now: ${cv}`);
      }
    });
  }
}

if (diffs.length === 0) {
  console.log(`✓ Manifest IDENTICAL — ${cur.length} projects, no field changed.`);
  process.exit(0);
}

console.log(`✗ ${diffs.length} difference(s):\n`);
for (const d of diffs) console.log("  " + d);
process.exit(1);
