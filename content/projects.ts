/* ─────────────────────────────────────────────────────────────
 *  ✦  This file is auto-built from your project folders.       ✦
 *
 *  You don't edit this file. To update the site:
 *
 *    →  Edit folders inside /public/work/
 *    →  See lilly-starter-assets/README.md or CONTENT.md
 *
 *  How a project is detected:
 *  - Any folder under public/work/ that isn't hidden (no leading
 *    dot or underscore).
 *  - Folder name like `01_baba-yaga` — the number = order (lower
 *    first), the rest becomes the URL slug.
 *  - Inside the folder, a tiny `_meta.txt` provides the title,
 *    category, year, and optional blurb.
 *  - Whichever image is named `cover.jpg` becomes the thumbnail;
 *    other images appear on the project page in alphabetical order.
 * ─────────────────────────────────────────────────────────────── */

import data from "./_manifest.json";

export type Category =
  | "character-design"
  | "environments"
  | "book-illustration"
  | "sketch-book"
  /* legacy / hidden — won't appear as a filter chip but still valid */
  | "vis-dev"
  | "editorial"
  | "environment"
  | "pattern";

/**
 * The four categories visible as filter chips on /work, in display order.
 * Anything outside this list still appears in "Everything" but won't
 * have its own chip.
 */
export const VISIBLE_CATEGORIES: Category[] = [
  "character-design",
  "environments",
  "book-illustration",
  "sketch-book",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  "character-design": "Character Design",
  environments: "Environments",
  "book-illustration": "Book Illustration",
  "sketch-book": "Sketchbook",
  /* legacy — kept so existing _meta.txt files don't break */
  "vis-dev": "Visual Development",
  editorial: "Editorial",
  environment: "Environments",
  pattern: "Pattern",
};

type ImageMeta = {
  src: string;
  w: number;
  h: number;
  /** True if EXIF/IPTC was rich (Software/Description present) — false for sketchbook scans */
  polished?: boolean;
};

export type VideoMeta = {
  src: string;
  label: string;
  /** Native pixel dimensions — needed by the justified-row grid */
  w: number;
  h: number;
  /** When true, `src` is a remote URL (Vimeo/YouTube) to embed via iframe */
  embed?: boolean;
};

export type Layout = "standard" | "gallery";

type RawProject = {
  order: number;
  slug: string;
  folder: string;
  title: string;
  category: string;
  year?: number;
  /** "standard" = hero + meta + doc grid. "gallery" = one big grid of all images. */
  layout?: Layout;
  /** Either the _meta.txt blurb or, if absent, prose extracted from Photoshop's Caption field */
  blurb?: string;
  /** Pulled from Caption "medium line" or Software/CreatorTool — null if absent */
  medium?: string | null;
  /** Physical size in inches/cm, derived from pixel dims ÷ DPI when DPI > 72 */
  size?: string | null;
  /** "Month Year" string from XMP CreateDate / EXIF DateTimeOriginal */
  date?: string | null;
  /** Embedded copyright string (e.g. "© 2026 Lilly Patterson") */
  copyright?: string | null;
  images: ImageMeta[];
  videos: VideoMeta[];
};

export type Project = {
  slug: string;
  title: string;
  category: Category;
  year?: number;
  layout: Layout;
  blurb?: string;
  medium?: string | null;
  size?: string | null;
  date?: string | null;
  copyright?: string | null;
  cover: ImageMeta;
  gallery: ImageMeta[];
  videos: VideoMeta[];
};

const VALID_CATEGORIES = new Set<Category>(
  Object.keys(CATEGORY_LABELS) as Category[]
);

const PLACEHOLDER: ImageMeta = { src: "/work/_missing.jpg", w: 1600, h: 1000 };

export const projects: Project[] = (data as { projects: RawProject[] }).projects.map(
  (p) => {
    const cat = (VALID_CATEGORIES.has(p.category as Category)
      ? p.category
      : "vis-dev") as Category;
    return {
      slug: p.slug,
      title: p.title,
      category: cat,
      year: p.year,
      layout: p.layout ?? "standard",
      blurb: p.blurb,
      medium: p.medium ?? null,
      size: p.size ?? null,
      date: p.date ?? null,
      copyright: p.copyright ?? null,
      cover: p.images[0] ?? PLACEHOLDER,
      gallery: p.images.length > 0 ? p.images : [PLACEHOLDER],
      videos: p.videos ?? [],
    };
  }
);

/** First project (the one prefixed `01_`) is the home page hero. */
export const heroProject = () => projects[0];

/**
 * The "a few favorites" strip on the home page. Reads the explicit slug
 * list from `site.homeFavorites`, in order. Slugs that don't match any
 * project are silently skipped — so you can stage a slug for a piece
 * you're about to add without breaking the build.
 */
const normalizeSlug = (s: string): string =>
  s
    .trim()
    .toLowerCase()
    // She is told to copy "the bit after /work/". Accept it if she pastes the
    // whole address, or the path, or leaves a trailing slash.
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/^\/?work\//, "")
    .replace(/\/+$/, "");

export const featuredProjects = (slugs: readonly string[]): Project[] => {
  // The hero is already shown, full width, directly above this strip. Letting
  // it appear again here shows the same piece twice on one screen — and it
  // happens by accident, because dragging a favorite to the top of the list in
  // the editor makes it the hero without removing it from the favorites.
  const heroSlug = projects[0]?.slug;
  const seen = new Set<string>();
  return slugs
    .map((s) => projects.find((proj) => proj.slug === normalizeSlug(s)))
    .filter((proj): proj is Project => Boolean(proj))
    .filter((proj) => proj.slug !== heroSlug)
    .filter((proj) => (seen.has(proj.slug) ? false : (seen.add(proj.slug), true)));
};

export const projectBySlug = (slug: string) =>
  projects.find((p) => p.slug === slug);

export const projectsByCategory = (category: Category | "all") =>
  category === "all"
    ? projects
    : projects.filter((p) => p.category === category);

export const adjacentProjects = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i < 0) return { prev: projects[0], next: projects[0] };
  return {
    prev: projects[(i - 1 + projects.length) % projects.length],
    next: projects[(i + 1) % projects.length],
  };
};
