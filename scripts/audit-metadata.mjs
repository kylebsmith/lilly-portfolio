// Read the FULL metadata blob from every image in /public/work/ so we can
// see exactly what Photoshop actually wrote — XMP, IPTC, EXIF, all of it.
// Used to debug why fields weren't surfacing.

import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import exifr from "exifr";

const ROOT = fileURLToPath(new URL("../public/work/", import.meta.url));
const SAMPLE_FOLDER = process.argv[2]; // optional: audit one folder

const isDir = async (p) => {
  try { return (await stat(p)).isDirectory(); } catch { return false; }
};

const interestingKeys = new Set([
  "Software", "Make", "Model",
  "ImageDescription", "Description", "Caption", "Caption-Abstract", "title",
  "DateTimeOriginal", "CreateDate", "ModifyDate", "DateCreated", "MetadataDate",
  "Copyright", "rights", "creator", "Artist",
  "XResolution", "YResolution", "ResolutionUnit",
  "Headline", "Instructions", "City", "State", "Country",
  "CreatorTool", "Producer",
]);

async function audit(filePath) {
  // No pick filter — get everything exifr can find
  const meta = await exifr.parse(filePath, {
    ifd0: true,
    exif: true,
    gps: false,
    iptc: true,
    xmp: true,
    icc: false,
    jfif: true,
    ihdr: false,
    mergeOutput: true,
    sanitize: true,
    translateKeys: true,
    translateValues: true,
    reviveValues: true,
  });
  return meta || {};
}

async function main() {
  const folders = (await readdir(ROOT)).sort();
  for (const folder of folders) {
    if (SAMPLE_FOLDER && folder !== SAMPLE_FOLDER) continue;
    const dir = join(ROOT, folder);
    if (!(await isDir(dir))) continue;
    if (folder.startsWith(".")) continue;

    const files = (await readdir(dir)).filter((f) => /^cover\.(jpe?g|png)$/i.test(f));
    if (files.length === 0) continue;
    const file = join(dir, files[0]);

    const m = await audit(file);
    const present = Object.keys(m).filter((k) => interestingKeys.has(k));

    console.log(`\n────────── ${folder}/${files[0]} ──────────`);
    if (present.length === 0) {
      console.log("  (no interesting metadata)");
      console.log("  ALL keys present:", Object.keys(m).join(", ") || "(empty)");
    } else {
      for (const k of present) {
        const v = m[k];
        const display = typeof v === "string" && v.length > 200 ? v.slice(0, 200) + "…" : v;
        console.log(`  ${k}: ${JSON.stringify(display)}`);
      }
      // also flag any other keys we didn't anticipate
      const others = Object.keys(m).filter((k) => !interestingKeys.has(k) && !["XResolution","YResolution","ResolutionUnit"].includes(k));
      if (others.length) console.log(`  (other keys: ${others.join(", ")})`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
