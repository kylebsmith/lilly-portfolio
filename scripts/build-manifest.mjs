// Walks /public/work/* — every folder there is a project.
// Reads its `_meta.txt`, lists the images, measures dimensions,
// and pulls real EXIF/IPTC/XMP metadata Photoshop writes:
//   • medium       (from the "medium line" inside Caption, or Software)
//   • size         (pixelDims ÷ DPI when DPI > 72)
//   • date         (XMP CreateDate / DateTimeOriginal)
//   • description  (the artist-written prose after the metadata header)
//
// Filters out class codes, instructor names, emails, and place lines
// before any string is exposed publicly.
//
// _meta.txt always wins as override.
//
// _meta.txt also carries the two fields a CMS needs but a folder name
// can't provide: `order` (display position — a CMS can rewrite a file but
// never rename a folder) and `hidden` (retire a piece without deleting it).
//
// Content errors a non-developer could create are validated below; see the
// ERROR vs WARNING note above `problems`.
//
// Runs before `dev` and `build`.

import { readdir, readFile, writeFile, stat, mkdir } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import exifr from "exifr";
import yaml from "js-yaml";

const execFileP = promisify(execFile);

/**
 * Probe a video for its native pixel dimensions using ffprobe.
 *
 * Resolution order:
 *   1. ffprobe (when available — local Mac, dev workstations)
 *   2. cached value from the committed manifest (Vercel build env,
 *      where ffprobe isn't installed but the previous manifest has
 *      the values from a local push)
 *   3. 1280×720 (16:9) default — only hits if a brand-new video is
 *      added on a build host without ffprobe and not yet in cache
 */
async function probeVideo(filePath, cached) {
  try {
    const { stdout } = await execFileP("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "csv=p=0:s=x",
      filePath,
    ]);
    const [w, h] = stdout.trim().split("x").map(Number);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return { w, h };
  } catch { /* ffprobe missing or failed — fall through */ }
  if (cached && cached.w && cached.h) return { w: cached.w, h: cached.h };
  return { w: 1280, h: 720 };
}

/**
 * Read whatever manifest is currently on disk and build a lookup of
 * video src → {w,h}. Used to seed video dimensions when ffprobe isn't
 * available on the build host.
 */
async function loadCachedVideoDims() {
  const cache = new Map();
  try {
    const text = await readFile(OUT, "utf8");
    const data = JSON.parse(text);
    for (const p of data.projects ?? []) {
      for (const v of p.videos ?? []) {
        if (v.src && Number(v.w) && Number(v.h)) {
          cache.set(v.src, { w: Number(v.w), h: Number(v.h) });
        }
      }
    }
  } catch { /* no existing manifest — fine */ }
  return cache;
}

const ROOT = fileURLToPath(new URL("../public/work/", import.meta.url));
const OUT = fileURLToPath(new URL("../content/_manifest.json", import.meta.url));

const isDir = async (p) => {
  try { return (await stat(p)).isDirectory(); } catch { return false; }
};

// Underscore only. With [_-], a CMS-created folder whose title starts with a
// number ("2026 Sketches" -> 2026-sketches) was read as prefix 2026 + slug
// "sketches": the site served /work/sketches while the editor showed
// 2026-sketches, and a homeFavorites entry typed as the displayed name would
// silently never match. Every existing folder uses NN_, so nothing regresses.
const FOLDER_RE = /^(?:(\d+)_)?(.+)$/;

/**
 * Parse a project's `_meta.txt`.
 *
 * Two parsers, in order:
 *
 *   1. REAL YAML (js-yaml). This is what a CMS writes. It quotes strings
 *      containing colons, folds long prose onto continuation lines, and
 *      uses block scalars (`>-`, `|`) for multi-line text. The old regex
 *      parser silently corrupted every one of those: a quoted title kept
 *      its quote characters, and a multi-line blurb became the literal
 *      string ">-". Content loss with a green build.
 *
 *   2. LEGACY LINE PARSER, as a fallback. Hand-typed files can contain an
 *      unquoted colon (`title: Dungeons: The Frame`), which is invalid
 *      YAML and makes js-yaml throw. The old behavior handled that fine,
 *      so we keep it for exactly that case.
 *
 * Verified against all 14 existing _meta.txt files: byte-identical output.
 */
function parseMeta(text) {
  // Tolerate a CMS writing frontmatter fences around the body.
  const stripped = text.replace(/^\s*---\r?\n([\s\S]*?)\r?\n---\s*$/, "$1");

  try {
    const doc = yaml.load(stripped);
    if (doc && typeof doc === "object" && !Array.isArray(doc)) {
      const out = {};
      for (const [k, v] of Object.entries(doc)) {
        if (v === null || v === undefined || v === "") continue;
        // Arrays are preserved as arrays: the CMS writes `gallery` as a
        // YAML list and image ordering depends on that structure. Flattening
        // it to a string here would silently discard her chosen order.
        out[String(k).toLowerCase()] =
          typeof v === "string" ? v.trim()
          // A bare YYYY-MM-DD (or one with a time) is the shape js-yaml
          // resolves to a Date object. String(date) would print
          // "Mon Jan 05 2026 05:00:00 GMT-0500 (EST)" straight onto the
          // project page. Format it the way the EXIF path already does.
          : v instanceof Date
            ? v.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
          : Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean)
          : String(v);
      }
      if (Object.keys(out).length > 0) return out;
    }
  } catch {
    /* invalid YAML (usually an unquoted colon) — fall through to legacy */
  }

  const out = {};
  for (const line of stripped.split(/\r?\n/)) {
    const m = line.match(/^\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const titleFromSlug = (slug) =>
  slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");

/**
 * Decide image order for a project.
 *
 * The CMS writes the artist's explicit choices into _meta.txt:
 *   cover:   dragon-hunt.jpg        <- the thumbnail she picked
 *   gallery: [study-a.jpg, ...]     <- the order she dragged them into
 *
 * Without this, the manifest picked the thumbnail purely by the filename
 * convention /^cover\./ and sorted the rest alphabetically. So choosing a
 * cover named anything else in the CMS put a DIFFERENT image on the site
 * than the one she selected — silently, with a green build.
 *
 * Files on disk that she never named are appended in the old order, so a
 * manually-dropped image still appears instead of vanishing.
 *
 * When _meta.txt names nothing (every file predating the CMS), this returns
 * the input untouched — identical to the previous behavior.
 */
function orderImages(imageFiles, metaTxt) {
  const present = new Set(imageFiles);
  const picked = [];

  const push = (raw) => {
    if (!raw) return;
    const name = basename(String(raw).trim());
    if (present.has(name) && !picked.includes(name)) picked.push(name);
  };

  push(metaTxt.cover);

  const gallery = Array.isArray(metaTxt.gallery)
    ? metaTxt.gallery
    : typeof metaTxt.gallery === "string" && metaTxt.gallery.trim()
      ? [metaTxt.gallery]
      : [];
  for (const g of gallery) push(g);

  if (picked.length === 0) return imageFiles;
  return [...picked, ...imageFiles.filter((f) => !picked.includes(f))];
}

const imageSort = (a, b) => {
  const aCover = /^cover\./i.test(a) ? 0 : 1;
  const bCover = /^cover\./i.test(b) ? 0 : 1;
  return aCover - bCover || a.localeCompare(b);
};

/* ────────────────────────────────────────────────────────────
 *  Content validation
 *
 *  Two severities, and the line between them is deliberate:
 *
 *    ERROR   → the build fails. On Vercel that means the deploy is
 *              rejected and the PREVIOUS deploy keeps serving, so a
 *              content mistake can never reach the public site.
 *              Reserved for cases where publishing would be WRONG or
 *              LOSSY *and* the fix is reachable from the CMS.
 *    WARNING → printed, build continues. Used wherever a sane fallback
 *              exists and its effect is self-evident to the editor
 *              ("my reorder didn't take", "wrong thumbnail").
 *
 *  Two hard rules, both of which exist to keep a non-developer unstuck:
 *
 *    1. A hard error must never be unclearable from the CMS. Anything
 *       whose only fix is renaming a FILE or a FOLDER is a warning —
 *       the CMS cannot rename either.
 *    2. `hidden: true` is checked BEFORE any validation, so setting a
 *       piece to Hidden always clears every error it could raise. That
 *       is the universal escape hatch, and it is why hard errors here
 *       are safe.
 *
 *  Errors are collected, not thrown, so one publish reports EVERY
 *  problem at once instead of one-per-failed-deploy.
 * ──────────────────────────────────────────────────────────── */

const problems = { errors: [], warnings: [] };
const fail = (folder, msg, fix) => problems.errors.push({ folder, msg, fix });
const warn = (folder, msg) => problems.warnings.push({ folder, msg });

// Must stay in sync with CATEGORY_LABELS in content/projects.ts and with the
// `options:` of the category select widget in the CMS config. The CMS writes
// a select, so an invalid value can only arrive by hand-editing a file.
const VALID_CATEGORIES = new Set([
  "character-design",
  "environments",
  "book-illustration",
  "sketch-book",
  /* legacy — still valid, just not filter chips */
  "vis-dev",
  "editorial",
  "environment",
  "pattern",
]);

// parseMeta stringifies every value, so YAML `hidden: false` arrives as the
// STRING "false" — which is truthy in JS. Never test metaTxt.hidden directly.
const isTrue = (v) => typeof v === "string" && /^(true|yes|y|on|1)$/i.test(v.trim());

// Problem reports are read by the artist, not a developer: name the piece the
// way she sees it in the CMS, not the way it is stored on disk.
const prettyName = (folderName) =>
  titleFromSlug(slugify(folderName.match(FOLDER_RE)?.[2] ?? folderName));

/**
 * Display order for a project.
 *
 *   _meta.txt `order:`  →  folder-name numeric prefix  →  9999
 *
 * The _meta.txt field is what makes the portfolio reorderable from the CMS:
 * a CMS can rewrite a file, but it can never rename a folder. When no
 * `order` field is present the behavior is byte-identical to before.
 *
 * Fractional values are honored on purpose (`order: 3.5` slots between 3 and
 * 4), so a piece can be inserted without renumbering everything after it.
 *
 * A non-numeric value is a WARNING, not an error: falling back to the folder
 * prefix leaves the piece exactly where it already was, which is both safe
 * and self-evident to the editor.
 */
function resolveOrder(metaTxt, folderName) {
  const prefix = folderName.match(FOLDER_RE)?.[1];
  const fromFolder = prefix ? parseInt(prefix, 10) : 9999;

  if (metaTxt.order === undefined) return fromFolder;

  const raw = String(metaTxt.order).trim();
  const n = raw === "" ? NaN : Number(raw);
  if (!Number.isFinite(n)) {
    warn(folderName,
      `order "${raw}" is not a number — ignored, keeping ${fromFolder}. ` +
      `Enter digits only (e.g. 3, or 3.5 to slot between 3 and 4).`);
    return fromFolder;
  }
  return n;
}

/* ────────────────────────────────────────────────────────────
 *  Sanitization — anything matching these is filtered out
 *  before we ever expose a string publicly.
 * ──────────────────────────────────────────────────────────── */

const PRIVATE_PATTERNS = [
  /\bILLU\s*\d{3,}\b/i,           // class codes (ILLU 503, ILLU 714)
  /\b[A-Z]{3,4}_\d{6}/i,          // SCAD term prefixes (ATL_202610...)
  /\S+@\S+\.\S+/i,                // email addresses
];

const isPrivateLine = (line) => PRIVATE_PATTERNS.some((re) => re.test(line));

// Plausibly an instructor's name — "FirstName LastName", capitalized,
// 2–4 tokens, no other punctuation. Skip these too.
const isProperName = (line) =>
  /^(?:[A-Z][a-zA-Z]+\s+){1,3}[A-Z][a-zA-Z]+$/.test(line.trim());

// Looks like a place — "City, State" or just a place name on its own line
const isPlaceLine = (line) => /^[A-Z][a-zA-Z\s]+,\s+[A-Z][a-zA-Z]+\s*$/.test(line.trim());

const MEDIUM_TELLS = [
  "digital", "watercolor", "watercolour", "gouache", "graphite",
  "pencil", "ink", "oil", "acrylic", "mixed media", "charcoal",
  "pastel", "marker", "pen and ink",
];

const isMediumLine = (line) => {
  const lower = line.trim().toLowerCase();
  return MEDIUM_TELLS.some(
    (m) => lower === m || lower.startsWith(m + " ") || lower.startsWith(m + ",")
  );
};

function softwareToMedium(...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    const s = String(c).toLowerCase();
    if (s.includes("photoshop")) return "Digital";
    if (s.includes("illustrator")) return "Digital";
    if (s.includes("procreate")) return "Digital (Procreate)";
    if (s.includes("clip studio")) return "Digital (Clip Studio)";
    if (s.includes("krita")) return "Digital (Krita)";
    if (s.includes("affinity")) return "Digital (Affinity)";
  }
  return null;
}

function titleCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bDigital\b/, "Digital");
}

/**
 * Extract just the medium from a multi-line caption block.
 * Conservative — only returns something if a line matches a known medium tell.
 */
function extractMedium(captionLines) {
  if (!captionLines) return null;
  const found = captionLines.find(isMediumLine);
  return found ? titleCase(found) : null;
}

/**
 * Extract the artist-written prose from a multi-line caption block.
 *
 * Photoshop's Caption typically looks like:
 *   Steamboat Springs, Colorado          ← place (skip)
 *   Digital                              ← medium (extract separately)
 *   ILLU 714                             ← class (skip)
 *   Yohey Horishita                      ← instructor (skip)
 *   lillybpatterson@gmail.com            ← email (skip)
 *                                        ← BLANK
 *   Surrealist illustration exploring…   ← real description ← KEEP
 *
 * Strategy:
 *   1. If there's a blank line, take everything after it.
 *   2. Otherwise, take any line that's clearly prose (>= 30 chars,
 *      not matching private/medium/place/name patterns).
 */
function extractDescription(captionLines) {
  if (!captionLines || captionLines.length === 0) return null;

  // Trim while preserving blank-line markers
  const lines = captionLines.map((l) => l.replace(/\s+$/, "").replace(/^\s+/, ""));

  // Approach 1: blank-line delimited
  const blankIdx = lines.findIndex((l) => l === "");
  if (blankIdx >= 0 && blankIdx < lines.length - 1) {
    const afterBlank = lines
      .slice(blankIdx + 1)
      .filter(Boolean)
      .filter((l) => !isPrivateLine(l));
    if (afterBlank.length > 0) {
      const prose = afterBlank.join(" ").trim();
      if (prose.length > 0) return prose;
    }
  }

  // Approach 2: heuristic — find a prose-like line
  const prose = lines.find(
    (l) =>
      l.length >= 30 &&
      !isPrivateLine(l) &&
      !isMediumLine(l) &&
      !isProperName(l) &&
      !isPlaceLine(l)
  );
  return prose || null;
}

function captionToLines(raw) {
  if (!raw) return null;
  const text = typeof raw === "string" ? raw : String(raw);
  return text.split(/\r?\n/);
}

function formatPhysicalSize(width, height, xRes, yRes, resolutionUnit) {
  if (!xRes || !yRes) return null;
  if (xRes <= 72 && yRes <= 72) return null;
  // exifr translates ResolutionUnit to "inches" / "cm" when translateValues is on.
  const unit =
    resolutionUnit === "cm" || resolutionUnit === 3 ? "cm" : "in";
  const w = Number((width / xRes).toFixed(1));
  const h = Number((height / yRes).toFixed(1));
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return null;
  return `${w} × ${h} ${unit}`;
}

function formatDate(d) {
  if (!d) return null;
  let date;
  try { date = d instanceof Date ? d : new Date(d); } catch { return null; }
  if (isNaN(+date)) return null;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function pickFirstString(...candidates) {
  for (const c of candidates) {
    if (c == null) continue;
    if (typeof c === "string" && c.trim()) return c;
    // exifr returns XMP language alternatives as { lang, value }
    if (typeof c === "object" && c.value && typeof c.value === "string" && c.value.trim()) {
      return c.value;
    }
  }
  return null;
}

async function readImageMeta(filePath) {
  const sharpMeta = await sharp(filePath).metadata();

  // Pull every block — let exifr give us everything it knows. We pluck
  // the fields we care about by name afterward.
  let exif = {};
  try {
    exif = (await exifr.parse(filePath, {
      ifd0: true,
      exif: true,
      iptc: true,
      xmp: true,
      jfif: true,
      mergeOutput: true,
      sanitize: true,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
    })) || {};
  } catch {
    exif = {};
  }

  // Caption / Description — Photoshop writes to several fields. Try in
  // priority order and keep the first one that has content.
  const rawCaption = pickFirstString(
    exif["Caption-Abstract"],
    exif.Caption,
    exif.ImageDescription,
    exif.description, // XMP dc:description (lowercased by exifr)
    exif.Description
  );
  const captionLines = captionToLines(rawCaption);

  // Software — both EXIF Software and XMP CreatorTool. Photoshop uses
  // CreatorTool more reliably on the XMP side.
  const software = pickFirstString(exif.Software, exif.CreatorTool);

  // Field extraction
  const medium = extractMedium(captionLines) || softwareToMedium(software);
  const description = extractDescription(captionLines);

  const size = formatPhysicalSize(
    sharpMeta.width ?? 0,
    sharpMeta.height ?? 0,
    Number(exif.XResolution) || sharpMeta.density || 0,
    Number(exif.YResolution) || sharpMeta.density || 0,
    exif.ResolutionUnit
  );

  // Prefer XMP CreateDate (when she started the file) over ModifyDate.
  const date = formatDate(
    exif.DateTimeOriginal ||
    exif.DateCreated ||
    exif.CreateDate ||
    exif.ModifyDate
  );

  // XMP title (e.g. "Breath of Life- Biomechanical Leviathan") — we don't
  // surface this as the project title (folder name is canonical) but
  // keep it on the image record so it's available if someone wants it.
  const xmpTitle = pickFirstString(exif.title, exif.Title);

  // Copyright string for footer-level attribution
  const copyright = pickFirstString(exif.Copyright, exif.rights);

  return {
    w: sharpMeta.width ?? 1,
    h: sharpMeta.height ?? 1,
    medium,
    size,
    date,
    description,
    xmpTitle,
    copyright,
    polished: Boolean(software || rawCaption),
  };
}

/* ────────────────────────────────────────────────────────────
 *  Walk the folders and write the manifest
 * ──────────────────────────────────────────────────────────── */

async function main() {
  // Seed video-dim cache from any previous manifest before we overwrite.
  // This is what makes Vercel deploys preserve the locally-probed dims.
  const cachedVideoDims = await loadCachedVideoDims();

  const folders = (await readdir(ROOT)).sort();
  const projects = [];
  let hiddenCount = 0;
  // folder → the title she sees in the CMS, for the problem report below.
  // Falls back to prettyName() for folders that never got that far.
  const titleByFolder = new Map();
  const label = (folder) => titleByFolder.get(folder) ?? prettyName(folder);

  for (const folderName of folders) {
    const dir = join(ROOT, folderName);
    if (!(await isDir(dir))) continue;
    if (folderName.startsWith(".") || folderName.startsWith("_")) continue;

    const m = folderName.match(FOLDER_RE);
    const slug = slugify(m?.[2] ?? folderName);

    // Distinguish "no _meta.txt at all" (the legacy drop-a-folder-of-images
    // path — still supported, see the warning further down) from "_meta.txt
    // exists but yielded no fields", which means a corrupt or truncated
    // write. Guessing our way past a corrupt write would publish wrong
    // content under a green build, so that one is a hard error.
    let metaTxt = {};
    let metaRaw = null;
    try {
      metaRaw = await readFile(join(dir, "_meta.txt"), "utf8");
    } catch { /* meta optional */ }
    const hasMeta = metaRaw !== null;
    if (hasMeta) {
      metaTxt = parseMeta(metaRaw);
      if (Object.keys(metaTxt).length === 0 && metaRaw.trim() !== "") {
        fail(folderName, "has a details file that could not be read — no fields were found in it.",
          "Open this project in the editor, re-enter Title and Category, and publish again.");
        continue;
      }
    }

    // ── hidden ──────────────────────────────────────────────
    // Checked before validation and before any image work: with CMS delete
    // disabled, this is the artist's only way to retire a piece — and,
    // because it runs first, it also clears any hard error the piece would
    // otherwise raise. Cheap, too: no EXIF/sharp pass on hidden folders.
    if (isTrue(metaTxt.hidden)) {
      hiddenCount++;
      continue;
    }

    const order = resolveOrder(metaTxt, folderName);

    const allFiles = await readdir(dir);
    const imageFiles = allFiles
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort(imageSort);
    const videoFiles = allFiles
      .filter((f) => /\.(mp4|mov|webm)$/i.test(f))
      .sort();

    if (imageFiles.length === 0) {
      // A project needs at least one image (its cover). Videos alone
      // can't be a portfolio piece's hero — they'd have no thumbnail.
      //
      // Not an error: "entry created, artwork still to come" is a legitimate
      // in-progress state in the CMS. But it must never be a SILENT no-op —
      // she saved something and nothing appeared on the site.
      warn(folderName, videoFiles.length > 0
        ? "has video but no image — not published. Add at least one image; the site needs it for the thumbnail."
        : "has no images yet — not published until at least one image is added.");
      continue;
    }

    // No file named cover.* — imageSort already falls back to the
    // alphabetically first image, and the page renders correctly with it.
    // WARNING, never an error: the only fix is to RENAME a file, and the CMS
    // cannot rename files. A hard error here would be unclearable from the
    // CMS in exactly the situation that triggers it.
    // Explicit choices from the CMS win over the filename convention.
    const orderedImages = orderImages(imageFiles, metaTxt);

    // Only warn when NOTHING chose the thumbnail — neither the CMS's
    // `cover:` key nor a file named cover.*. Otherwise the first image
    // is a deliberate choice and there is nothing to report.
    if (!metaTxt.cover && !/^cover\./i.test(orderedImages[0])) {
      warn(folderName,
        `has no cover image set — using "${orderedImages[0]}" as the thumbnail. ` +
        `Open this project in the editor and pick a Cover image.`);
    }

    const images = await Promise.all(
      orderedImages.map(async (f) => {
        const m = await readImageMeta(join(dir, f));
        return { src: `/work/${folderName}/${f}`, ...m };
      })
    );

    // Videos — probe real dimensions so the proportional grid can
    // honor each one's actual aspect ratio (vertical phone footage,
    // 16:9 timelapses, etc. all behave correctly).
    const videos = await Promise.all(videoFiles.map(async (f) => {
      const src = `/work/${folderName}/${f}`;
      const dim = await probeVideo(join(dir, f), cachedVideoDims.get(src));
      return {
        src,
        label: f.replace(/\.(mp4|mov|webm)$/i, "").replace(/[-_]+/g, " "),
        w: dim.w,
        h: dim.h,
      };
    }));

    // Optional Vimeo embed via _meta.txt: `video: https://vimeo.com/123456`
    if (metaTxt.video && /^https?:\/\//.test(metaTxt.video)) {
      videos.push({ src: metaTxt.video, label: "Process video", embed: true, w: 1280, h: 720 });
    }

    const cover = images[0];
    const polished = images.some((img) => img.polished);

    // _meta.txt always wins for blurb. If absent or empty, fall back to
    // the prose Lilly wrote inside Photoshop's caption field.
    const blurb = metaTxt.blurb && metaTxt.blurb.trim()
      ? metaTxt.blurb
      : cover.description || undefined;

    // Layout: "standard" (default — hero image + meta strip + doc grid)
    //         "gallery"  (one big grid of all images, no formal hero/meta)
    const layout = (metaTxt.layout && /^(standard|gallery)$/.test(metaTxt.layout))
      ? metaTxt.layout
      : "standard";

    // ── title ───────────────────────────────────────────────
    // No _meta.txt at all → legacy behavior preserved exactly: guess the
    // title from the folder name and publish (see item 3 in the notes).
    // _meta.txt present but title missing/blank → the field was cleared or
    // the write was truncated; guessing would put a wrong title on a live
    // page under a green build, so that is a hard error.
    const metaTitle = typeof metaTxt.title === "string" ? metaTxt.title.trim() : "";
    const title = metaTitle || titleFromSlug(slug);
    if (!metaTitle) {
      if (hasMeta) {
        fail(folderName, "has no title.",
          "Open this project in the editor, type its Title, and publish again.");
      } else {
        warn(folderName,
          `has no details file — published with the guessed title "${title}", ` +
          `category "${polished ? "book-illustration" : "sketch-book"}" and order ${order}. ` +
          `Open it in the editor and save it once to take control of those.`);
      }
    }

    // ── category ────────────────────────────────────────────
    // An unknown value doesn't crash today — content/projects.ts quietly
    // coerces it to "vis-dev", which drops the piece off every filter chip
    // while leaving it in "Everything". That is an invisible content bug
    // ("why isn't my new piece under Environments?"), so: hard error. It is
    // clearable from the CMS by picking a value from the dropdown, and the
    // message names the whole valid list.
    const category = metaTxt.category
      ? String(metaTxt.category).trim()
      : (polished ? "book-illustration" : "sketch-book");
    if (!VALID_CATEGORIES.has(category)) {
      fail(folderName, `has an unrecognized category, "${category}".`,
        `Pick one of these in the editor: ${[...VALID_CATEGORIES].slice(0, 4).join(", ")}.`);
    }

    titleByFolder.set(folderName, title);
    projects.push({
      order,
      slug,
      folder: folderName,
      title,
      category,
      year: metaTxt.year ? Number(metaTxt.year) : undefined,
      blurb,
      layout,
      medium: metaTxt.medium || cover.medium || null,
      size: metaTxt.size || cover.size || null,
      date: metaTxt.date || cover.date || null,
      copyright: cover.copyright || null,
      images,
      videos,
    });
  }

  // ── order collisions ────────────────────────────────────────
  // WARNING, not an error, and deliberately so: two pieces briefly sharing a
  // number is an ordinary intermediate state while reordering (set A to 5,
  // save; set B to 6, save). Failing the build on the first of those two
  // saves would punish a correct workflow with a dead deploy. The tie-break
  // below is deterministic, so the result is stable — just not necessarily
  // the one she intended, which is what the warning says.
  //
  // (This repo already contains such a collision: 11_mfa-sketchbook and
  // 11_sketchbook. A hard error here would fail the build today.)
  const byOrder = new Map();
  for (const p of projects) {
    const k = String(p.order);
    if (!byOrder.has(k)) byOrder.set(k, []);
    byOrder.get(k).push(p);
  }
  for (const [k, group] of byOrder) {
    if (group.length < 2) continue;
    const tied = [...group].sort((a, b) => a.folder.localeCompare(b.folder));
    warn(tied[0].folder,
      `order ${k} is used by ${group.length} projects ` +
      `(${tied.map((p) => p.title).join(", ")}). ` +
      `They are shown in that order — give each a different number to choose.`);
  }

  projects.sort((a, b) => a.order - b.order || a.folder.localeCompare(b.folder));

  // ── report ──────────────────────────────────────────────────
  for (const w of problems.warnings) console.warn(`  ⚠  ${label(w.folder)} — ${w.msg}`);

  // Errors abort BEFORE the manifest is written, so a failed validation can
  // never leave a bad content/_manifest.json on disk to be committed later.
  if (problems.errors.length > 0) {
    console.error(
      `\n✗  The site was NOT updated — nothing is broken.\n` +
      `   The last working version is still live and visitors see it as normal.\n` +
      `   Fix the item${problems.errors.length > 1 ? "s" : ""} below in the editor, ` +
      `then publish again.\n`
    );
    for (const e of problems.errors) {
      console.error(`   • ${label(e.folder)} ${e.msg}\n     → ${e.fix}\n`);
    }
    console.error(
      `   Still stuck on one of these? Set that piece to Hidden and publish.\n` +
      `   That always clears the problem and takes it off the site until it's ready.\n`
    );
    process.exit(1);
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify({ projects }, null, 2) + "\n");

  const stats = {
    projects: projects.length,
    images: projects.reduce((n, p) => n + p.images.length, 0),
    withMedium: projects.filter((p) => p.medium).length,
    withSize: projects.filter((p) => p.size).length,
    withDate: projects.filter((p) => p.date).length,
    withDescription: projects.filter((p) => p.blurb).length,
    withCopyright: projects.filter((p) => p.copyright).length,
  };
  console.log(
    `✓ Manifest: ${stats.projects} projects · ${stats.images} images · ` +
    `medium ${stats.withMedium} · size ${stats.withSize} · date ${stats.withDate} · ` +
    `desc ${stats.withDescription} · © ${stats.withCopyright}` +
    (hiddenCount > 0 ? ` · ${hiddenCount} hidden` : "")
  );
  // The first project is the home page hero (content/projects.ts). Say which
  // one, out loud, every build — reordering silently changes the front page.
  if (projects[0]) console.log(`  ↳ home page hero: ${projects[0].title}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
