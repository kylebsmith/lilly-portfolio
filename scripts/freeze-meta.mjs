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
const ORDER = ["order", "title", "category", "cover", "gallery", "year",
               "medium", "size", "date", "layout", "video", "blurb", "hidden"];

// Frozen from EXIF.
const FREEZE = ["medium", "size", "date", "blurb"];

// Frozen from facts the build already knows implicitly. Both are REQUIRED for
// the CMS to behave:
//
//   order  Sveltia computes a new entry's order as max(existing)+1. With no
//          file carrying one, that is 1 — so a brand-new piece would sort to
//          the very top, and the first drag would renumber everything from
//          Sveltia's own list order rather than the folder prefixes. The
//          homepage hero is projects[0], so that silently reassigns it.
//
//   cover  The `cover` field is REQUIRED in the CMS. With no cover: key, every
//          existing project opens with an empty required field and Save is
//          refused — blocking even a one-character typo fix on all of them.
const DERIVE = ["order", "cover"];

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

  // Derived values, taken from what the manifest already computed so the
  // rendered site cannot change.
  if (next.order === undefined || next.order === null || next.order === "") {
    if (Number.isFinite(p.order) && p.order !== 9999) {
      next.order = p.order;
      added.push("order");
    }
  }
  if (next.cover === undefined || next.cover === null || next.cover === "") {
    const first = p.images?.[0]?.src;
    if (first) {
      next.cover = first.split("/").pop();
      added.push("cover");
    }
  }

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
