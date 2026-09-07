// Adversarial regression suite for the content pipeline.
//
// Creates throwaway project folders under public/work/, fills each with a
// hostile _meta.txt, runs the real build-manifest, and asserts the pipeline
// neither crashes nor publishes nonsense. Everything is removed afterwards,
// and the suite fails if the real manifest is not restored byte-for-byte.
//
//   node scripts/torture-test.mjs
//
// Exits 0 when every case passes.

import { mkdir, writeFile, rm, readFile, copyFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const ROOT = fileURLToPath(new URL("../public/work/", import.meta.url));
const MANIFEST = fileURLToPath(new URL("../content/_manifest.json", import.meta.url));
const SCRIPT = fileURLToPath(new URL("./build-manifest.mjs", import.meta.url));
const PREFIX = "zztorture";

let SRC_IMG;

const run = async () => {
  try { return { ok: true, out: (await execFileP("node", [SCRIPT])).stdout }; }
  catch (e) { return { ok: false, out: (e.stdout || "") + (e.stderr || "") }; }
};

const manifest = async () => JSON.parse(await readFile(MANIFEST, "utf8")).projects;

/* Each case: folder suffix, files to write, and an assertion over its project
   record (or null when the pipeline is expected to withhold it). */
const CASES = [
  { n: "01-empty-meta",       meta: "",                               images: 1,
    expect: null /* hard error: file present but parses to nothing */, skipBatch: true },
  { n: "02-no-meta",          meta: null,                             images: 1, expect: (p) => p && p.title },
  { n: "03-emoji-title",      meta: "title: Moth 🦋 Study\ncategory: environments\n", images: 1,
    expect: (p) => p && p.title.includes("🦋") },
  { n: "04-unquoted-colon",   meta: "title: Girl: A Study\ncategory: environments\n", images: 1,
    expect: (p) => p && p.title === "Girl: A Study" },
  { n: "05-quoted",           meta: 'title: "Quoted Title"\ncategory: environments\n', images: 1,
    expect: (p) => p && p.title === "Quoted Title" },
  { n: "06-block-blurb",      meta: "title: Block\ncategory: environments\nblurb: >-\n  line one\n  line two\n", images: 1,
    expect: (p) => p && p.blurb === "line one line two" },
  { n: "07-literal-blurb",    meta: "title: Literal\ncategory: environments\nblurb: |-\n  first\n  second\n", images: 1,
    expect: (p) => p && p.blurb.includes("\n") },
  { n: "08-accents",          meta: "title: Café Naïve — Étude\ncategory: environments\n", images: 1,
    expect: (p) => p && p.title.includes("Café") },
  { n: "09-bad-category",     meta: "title: Bad Cat\ncategory: not-a-real-category\n", images: 1,
    expect: null /* hard error expected — tested separately */, skipBatch: true },
  { n: "10-dup-order-a",      meta: "order: 500\ntitle: Dup A\ncategory: environments\n", images: 1,
    expect: (p) => p && p.order === 500 },
  { n: "11-dup-order-b",      meta: "order: 500\ntitle: Dup B\ncategory: environments\n", images: 1,
    expect: (p) => p && p.order === 500 },
  { n: "12-order-garbage",    meta: "order: not-a-number\ntitle: Garbage Order\ncategory: environments\n", images: 1,
    expect: (p) => p && Number.isFinite(p.order) },
  { n: "13-order-negative",   meta: "order: -5\ntitle: Negative\ncategory: environments\n", images: 1,
    expect: (p) => p && Number.isFinite(p.order) },
  { n: "14-hidden-true",      meta: "title: Hidden\ncategory: environments\nhidden: true\n", images: 1,
    expect: (p) => p === undefined },
  { n: "15-hidden-strfalse",  meta: 'title: Not Hidden\ncategory: environments\nhidden: "false"\n', images: 1,
    expect: (p) => p !== undefined },
  { n: "16-hidden-no",        meta: "title: Hidden No\ncategory: environments\nhidden: no\n", images: 1,
    expect: (p) => p !== undefined },
  { n: "17-cover-missing",    meta: "title: Cover Gone\ncategory: environments\ncover: nope.jpg\n", images: 2,
    expect: (p) => p && p.images.length === 2 },
  // A gallery naming only a file that no longer exists. The list is
  // authoritative, so nothing extra is published — but the project must not
  // vanish, so the cover is always kept.
  { n: "18-gallery-missing",  meta: "title: Gal Gone\ncategory: environments\ngallery:\n  - ghost.jpg\n", images: 2,
    expect: (p) => p && p.images.length === 1 },
  { n: "19-yaml-date",        meta: "title: Date Obj\ncategory: environments\ndate: 2026-01-05\n", images: 1,
    expect: (p) => p && !/GMT|\(/.test(p.date) },
  { n: "20-date-with-time",   meta: "title: Date Time\ncategory: environments\ndate: 2026-01-05 10:00:00\n", images: 1,
    expect: (p) => p && !/GMT|\(/.test(p.date) },
  { n: "21-crlf",             meta: "title: CRLF Test\r\ncategory: environments\r\nyear: 2026\r\n", images: 1,
    expect: (p) => p && p.title === "CRLF Test" },
  { n: "22-frontmatter",      meta: "---\ntitle: Fenced\ncategory: environments\n---\n", images: 1,
    expect: (p) => p && p.title === "Fenced" },
  { n: "23-yaml-specials",    meta: "title: '*starred* & <tagged>'\ncategory: environments\n", images: 1,
    expect: (p) => p && p.title.includes("starred") },
  { n: "24-long-title",       meta: "title: " + "A".repeat(400) + "\ncategory: environments\n", images: 1,
    expect: (p) => p && p.title.length === 400 },
  { n: "25-vimeo",            meta: "title: Vimeo\ncategory: environments\nvideo: https://vimeo.com/123456789\n", images: 1,
    expect: (p) => p && p.videos.some((v) => v.embed) },
  { n: "26-bad-video-url",    meta: "title: Bad Vid\ncategory: environments\nvideo: not-a-url\n", images: 1,
    expect: (p) => p && !p.videos.some((v) => v.embed) },
  { n: "27-tabs",             meta: "title:\tTabbed\ncategory: environments\n", images: 1,
    expect: (p) => p && p.title === "Tabbed" },
  { n: "28-weird-filenames",  meta: "title: Weird Files\ncategory: environments\n", images: 0,
    files: { "a file with spaces.jpg": true, "ünïcødé.jpg": true }, expect: (p) => p && p.images.length === 2 },
  { n: "29-no-images",        meta: "title: Imageless\ncategory: environments\n", images: 0,
    expect: (p) => p === undefined },
  { n: "30-numeric-title",    meta: "title: 2026 Sketches\ncategory: environments\n", images: 1,
    expect: (p) => p && p.title === "2026 Sketches" },
  // ── Round 2: failure modes found by adversarial verification ──
  { n: "31-blurb-leaks-email",  meta: "title: Leaky Blurb\ncategory: environments\nblurb: A study of light. Contact me at lillybpatterson@gmail.com for prints.\n", images: 1,
    expect: (p) => p && !/@/.test(p.blurb ?? "") },
  { n: "32-blurb-leaks-class",  meta: "title: Leaky Class\ncategory: environments\nblurb: A surreal environment study. ILLU 714 final submission.\n", images: 1,
    expect: (p) => p && !/ILLU/i.test(p.blurb ?? "") },
  { n: "33-clips-order",        meta: null, images: 1, clips: ["b-second.mp4", "a-first.mp4"],
    metaAfter: "title: Clip Order\ncategory: environments\nclips:\n  - b-second.mp4\n  - a-first.mp4\n",
    expect: (p) => p && p.videos[0]?.src.endsWith("b-second.mp4") },
  { n: "36-details-toggle-off", meta: "title: No Details\ncategory: environments\nuse_file_details: false\n", images: 1,
    expect: (p) => p && p.medium === null && p.size === null && p.date === null && p.blurb === undefined },
  { n: "37-details-toggle-on",  meta: "title: With Details\ncategory: environments\nuse_file_details: true\n", images: 1,
    expect: (p) => p && p.size !== null },
  // ── The list is the set, not a hint (her curation must stick) ──
  { n: "38-gallery-is-authoritative", meta: null, images: 3,
    metaAfter: "title: Curated\ncategory: environments\ncover: cover.jpg\ngallery:\n  - img-1.jpg\n",
    expect: (p) => p && p.images.length === 2 && !p.images.some(i => i.src.endsWith("img-2.jpg")) },
  { n: "39-gallery-absent-legacy",   meta: "title: Legacy\ncategory: environments\n", images: 3,
    expect: (p) => p && p.images.length === 3 },
  { n: "40-gallery-empty-cover-only", meta: null, images: 3,
    metaAfter: "title: Cover Only\ncategory: environments\ncover: cover.jpg\ngallery: []\n",
    expect: (p) => p && p.images.length === 1 && p.images[0].src.endsWith("cover.jpg") },
  { n: "41-clips-removable",         meta: null, images: 1, clips: ["a-first.mp4", "b-second.mp4"],
    metaAfter: "title: One Clip\ncategory: environments\nclips:\n  - a-first.mp4\n",
    expect: (p) => p && p.videos.filter(v => !v.embed).length === 1 },
  { n: "42-clips-empty-removes-all", meta: null, images: 1, clips: ["a-first.mp4"],
    metaAfter: "title: No Clips\ncategory: environments\nclips: []\n",
    expect: (p) => p && p.videos.filter(v => !v.embed).length === 0 },
  { n: "43-clips-absent-legacy",     meta: null, images: 1, clips: ["a-first.mp4"],
    metaAfter: "title: Legacy Clips\ncategory: environments\n",
    expect: (p) => p && p.videos.filter(v => !v.embed).length === 1 },
  // ── The editor cannot write an empty list, so on an editor-managed file a
  //    MISSING list means "she removed them all" (use_file_details is the marker) ──
  { n: "44-managed-missing-gallery", meta: "title: Managed\ncategory: environments\ncover: cover.jpg\nuse_file_details: true\n", images: 3,
    expect: (p) => p && p.images.length === 1 },
  { n: "45-managed-missing-clips",   meta: null, images: 1, clips: ["a-first.mp4"],
    metaAfter: "title: Managed Clips\ncategory: environments\nuse_file_details: true\n",
    expect: (p) => p && p.videos.filter(v => !v.embed).length === 0 },
  { n: "46-unmanaged-keeps-all",     meta: "title: Legacy File\ncategory: environments\ncover: cover.jpg\n", images: 3,
    expect: (p) => p && p.images.length === 3 },
  // The marker must be ignored when the LEGACY parser produced it: that parser
  // cannot read a block list, so one unquoted colon would look "managed with no
  // gallery" and silently destroy the whole gallery.
  { n: "47-legacy-parser-ignores-marker", meta: null, images: 3,
    metaAfter: "title: Girl: A Study\ncategory: environments\ncover: cover.jpg\nuse_file_details: true\ngallery:\n  - img-1.jpg\n",
    expect: (p) => p && p.images.length === 2 },
  { n: "48-bare-gallery-key",        meta: "title: Bare List\ncategory: environments\ncover: cover.jpg\ngallery:\n", images: 3,
    expect: (p) => p && p.images.length === 1 },
  { n: "34-corrupt-image",      meta: "title: Corrupt\ncategory: environments\n", images: 1, corrupt: true,
    expect: null /* hard error, named */, skipBatch: true },
  { n: "35-duplicate-slug",     meta: "title: Book Spots\ncategory: environments\n", images: 1, forceSlug: "book-spots",
    expect: null /* hard error: collides with the real book-spots */, skipBatch: true },
];

async function makeCase(c) {
  const folder = c.forceSlug ? `900_${c.forceSlug}` : `${PREFIX}-${c.n}`;
  const dir = join(ROOT, folder);
  await mkdir(dir, { recursive: true });
  if (c.files) {
    for (const f of Object.keys(c.files)) await copyFile(SRC_IMG, join(dir, f));
  } else {
    for (let i = 0; i < (c.images ?? 0); i++) {
      await copyFile(SRC_IMG, join(dir, i === 0 ? "cover.jpg" : `img-${i}.jpg`));
    }
  }
  if (c.clips) {
    // Any real mp4 works; only the ORDER of the list is under test.
    const src = join(ROOT, "04_lost-in-a-dream", "process-clip.mp4");
    for (const f of c.clips) await copyFile(src, join(dir, f));
  }
  if (c.corrupt) {
    // A file with a .jpg name that sharp cannot decode — a truncated upload,
    // or a renamed .psd. This used to kill the build with a bare stack trace.
    await writeFile(join(dir, "cover.jpg"), "this is not an image at all");
  }
  const body = c.metaAfter ?? c.meta;
  if (body !== null && body !== undefined) await writeFile(join(dir, "_meta.txt"), body);
  return folder;
}

async function cleanup() {
  for (const d of await readdir(ROOT)) {
    if (d.startsWith(PREFIX) || d.startsWith("900_")) {
      await rm(join(ROOT, d), { recursive: true, force: true });
    }
  }
}

async function main() {
  // Smallest real image in the repo, so 30 copies stay cheap.
  const candidates = [];
  for (const d of await readdir(ROOT)) {
    if (d.startsWith(PREFIX) || d.startsWith(".") || d.startsWith("_")) continue;
    for (const f of await readdir(join(ROOT, d)).catch(() => [])) {
      if (/\.jpe?g$/i.test(f)) candidates.push(join(ROOT, d, f));
    }
  }
  const { stat } = await import("node:fs/promises");
  let smallest = null, size = Infinity;
  for (const c of candidates.slice(0, 60)) {
    const s = (await stat(c)).size;
    if (s < size) { size = s; smallest = c; }
  }
  SRC_IMG = smallest;

  await run(); // settle the manifest first so the restore check is meaningful
  const before = await readFile(MANIFEST, "utf8");
  let pass = 0, fail = 0;

  try {
    await cleanup();

    // ── Batch: every case expected to survive ──
    const batch = CASES.filter((c) => !c.skipBatch);
    for (const c of batch) await makeCase(c);

    const r = await run();
    if (!r.ok) {
      console.log("✗ BATCH RUN CRASHED — pipeline did not survive:\n" + r.out.slice(-1500));
      fail += batch.length;
    } else {
      const projects = await manifest();
      for (const c of batch) {
        const folder = `${PREFIX}-${c.n}`;
        const p = projects.find((x) => x.folder === folder);
        let ok = false;
        try { ok = Boolean(c.expect(p)); } catch { ok = false; }
        if (ok) { pass++; console.log(`  ✓ ${c.n}`); }
        else { fail++; console.log(`  ✗ ${c.n}   got: ${p ? JSON.stringify({title:p.title,order:p.order,date:p.date,blurb:p.blurb,imgs:p.images?.length}) : "not published"}`); }
      }
    }
    await cleanup();

    // ── Isolated: cases expected to HARD-FAIL the build ──
    for (const c of CASES.filter((x) => x.skipBatch)) {
      await makeCase(c);
      const r2 = await run();
      if (!r2.ok) { pass++; console.log(`  ✓ ${c.n}  (correctly failed the build)`); }
      else { fail++; console.log(`  ✗ ${c.n}  build PASSED but should have failed`); }

      // ...and that `hidden` clears it, the documented escape hatch.
      const dir2 = c.forceSlug ? `900_${c.forceSlug}` : `${PREFIX}-${c.n}`;
      await writeFile(join(ROOT, dir2, "_meta.txt"), (c.metaAfter ?? c.meta) + "hidden: true\n");
      const r3 = await run();
      if (r3.ok) { pass++; console.log(`  ✓ ${c.n}  (hidden:true clears the hard error)`); }
      else { fail++; console.log(`  ✗ ${c.n}  hidden:true did NOT clear the error`); }
      await cleanup();
    }
  } finally {
    await cleanup();
    await run();
  }

  const after = await readFile(MANIFEST, "utf8");
  if (before === after) { pass++; console.log("  ✓ manifest restored byte-identical"); }
  else { fail++; console.log("  ✗ MANIFEST NOT RESTORED"); }

  console.log(`\n${fail === 0 ? "✓ ALL PASS" : "✗ FAILURES"} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); cleanup().then(() => process.exit(1)); });
