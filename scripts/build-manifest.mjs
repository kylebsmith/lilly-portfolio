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
// Runs before `dev` and `build`.

import { readdir, readFile, writeFile, stat, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import exifr from "exifr";

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

const FOLDER_RE = /^(?:(\d+)[_-])?(.+)$/;

function parseMeta(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([a-zA-Z]+)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const titleFromSlug = (slug) =>
  slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");

const imageSort = (a, b) => {
  const aCover = /^cover\./i.test(a) ? 0 : 1;
  const bCover = /^cover\./i.test(b) ? 0 : 1;
  return aCover - bCover || a.localeCompare(b);
};

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

  for (const folderName of folders) {
    const dir = join(ROOT, folderName);
    if (!(await isDir(dir))) continue;
    if (folderName.startsWith(".") || folderName.startsWith("_")) continue;

    const m = folderName.match(FOLDER_RE);
    const order = m?.[1] ? parseInt(m[1], 10) : 9999;
    const slug = slugify(m?.[2] ?? folderName);

    let metaTxt = {};
    try {
      metaTxt = parseMeta(await readFile(join(dir, "_meta.txt"), "utf8"));
    } catch { /* meta optional */ }

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
      if (videoFiles.length > 0) {
        console.warn(`  ⚠ ${folderName}: video(s) found but no image — skipping`);
      }
      continue;
    }

    const images = await Promise.all(
      imageFiles.map(async (f) => {
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

    projects.push({
      order,
      slug,
      folder: folderName,
      title: metaTxt.title ?? titleFromSlug(slug),
      category: metaTxt.category ?? (polished ? "book-illustration" : "sketch-book"),
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

  projects.sort((a, b) => a.order - b.order || a.folder.localeCompare(b.folder));

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
    `desc ${stats.withDescription} · © ${stats.withCopyright}`
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
