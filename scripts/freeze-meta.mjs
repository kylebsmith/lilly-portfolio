// Freeze EXIF-derived values into each project's `_meta.txt`.
//
// WHY THIS EXISTS
// build-manifest.mjs derives `medium`, `size`, `date` and the blurb from
// Photoshop metadata embedded in the JPEG itself. That data is invisible,
// uneditable by a non-developer, and destroyed by ANY image re-encode —
// a CMS "optimize images" toggle, a resize, a re-export. It would vanish
// silently, with a green build.
//
// The manifest already prefers explicit values:
//     medium: metaTxt.medium || cover.medium || null
// ...so writing the derived values into `_meta.txt` needs no code change.
// It converts invisible, fragile bytes into committed, CMS-editable text.
//
// Idempotent: a field already present in `_meta.txt` is never overwritten.
//
//   node scripts/freeze-meta.mjs           # preview only
//   node scripts/freeze-meta.mjs --write   # apply

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import yaml from "js-yaml";

const execFileP = promisify(execFile);
const ROOT = fileURLToPath(new URL("../public/work/", import.meta.url));
const MANIFEST = fileURLToPath(new URL("../content/_manifest.json", import.meta.url));
const WRITE = process.argv.includes("--write");
const ALL = process.argv.includes("--all");

// Field order in the written file — reads top-down like a form.
const ORDER = ["title", "category", "year", "medium", "size", "date", "layout", "video", "blurb"];

// Only these are frozen from EXIF. `title`/`category`/`year` are already explicit.
const FREEZE = ["medium", "size", "date", "blurb"];

const tracked = new Set();
try {
  const { stdout } = await execFileP("git", ["ls-files", "public/work"]);
  for (const line of stdout.split("\n")) {
    const m = line.match(/^public\/work\/([^/]+)\//);
    if (m) tracked.add(m[1]);
  }
} catch { /* not a git repo — fall through, ALL applies */ }

const { projects } = JSON.parse(await readFile(MANIFEST, "utf8"));
let changed = 0, skipped = 0;

for (const p of projects) {
  if (!ALL && !tracked.has(p.folder)) {
    console.log(`  ⊘ ${p.folder.padEnd(30)} untracked — skipped (use --all to include)`);
    skipped++;
    continue;
  }

  const file = join(ROOT, p.folder, "_meta.txt");
  let existing = {};
  try { existing = yaml.load(await readFile(file, "utf8")) || {}; } catch { existing = {}; }
  if (typeof existing !== "object" || Array.isArray(existing)) existing = {};

  const added = [];
  const next = { ...existing };
  for (const key of FREEZE) {
    if (next[key] !== undefined && next[key] !== null && next[key] !== "") continue;
    const val = p[key];
    if (val === undefined || val === null || val === "") continue;
    next[key] = val;
    added.push(key);
  }

  if (added.length === 0) {
    console.log(`  = ${p.folder.padEnd(30)} already complete`);
    continue;
  }

  // Rebuild in a stable, human-readable order.
  const ordered = {};
  for (const k of ORDER) if (next[k] !== undefined) ordered[k] = next[k];
  for (const k of Object.keys(next)) if (!(k in ordered)) ordered[k] = next[k];

  const out = yaml.dump(ordered, { lineWidth: -1, quotingType: '"', forceQuotes: false });
  console.log(`  + ${p.folder.padEnd(30)} froze: ${added.join(", ")}`);
  if (WRITE) await writeFile(file, out);
  changed++;
}

console.log(
  `\n${WRITE ? "Wrote" : "Would write"} ${changed} file(s)` +
  (skipped ? `, skipped ${skipped} untracked` : "") +
  (WRITE ? "" : "  — rerun with --write to apply")
);
