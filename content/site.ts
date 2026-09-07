/* ───────────────────────────────────────────────────────────
 *  ✦ Site settings ✦
 *
 *  MOST OF THIS FILE IS NO LONGER EDITED BY HAND.
 *
 *  Your name, tagline, bio, email, social links and homepage
 *  favorites live in `site-content.json`, right next to this
 *  file — and you edit them in the website editor at /admin,
 *  under "About & Contact". You never need to open either file.
 *
 *  Two values deliberately stay here in code, where the editor
 *  cannot reach them, because a typo in either one breaks the
 *  whole site rather than one page:
 *
 *    url  — feeds new URL() in layout.tsx and every sitemap entry.
 *    nav  — the top navigation. A bad href here is a broken link
 *           on every single page.
 *  ───────────────────────────────────────────────────────── */

import content from "./site-content.json";

/**
 * Everything below is defensive on purpose.
 *
 * These values come from a JSON file a non-developer edits through a form.
 * Emptying a list there used to be a BUILD FAILURE, not a content mistake:
 * TypeScript infers `[]` as `never[]`, so `.map()` over it stopped
 * type-checking and the whole site failed to compile. A missing key did the
 * same. That is exactly backwards — clearing a box should give you an empty
 * section, not a broken deploy.
 *
 * So: read through `unknown`, validate shapes, fall back to something
 * renderable, and never let the JSON's inferred literal type reach a consumer.
 */
const raw = content as unknown as Record<string, unknown>;

const str = (v: unknown, fallback: string): string =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;

const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()) : [];

/** Collapses to one line — this feeds <meta name="description">, where a
 *  newline from a multi-line textarea renders as a broken tag attribute. */
const oneLine = (v: unknown, fallback: string, max = 200): string => {
  const t = str(v, fallback).replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
};

export type SocialLink = { label: string; href: string };

const socialLinks = (v: unknown): SocialLink[] =>
  Array.isArray(v)
    ? v.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const o = item as Record<string, unknown>;
        const href = str(o.href, "");
        const label = str(o.label, "");
        // A link with no destination is worse than no link at all.
        if (!href || !/^https?:\/\//i.test(href) || !label) return [];
        return [{ label, href }];
      })
    : [];

/**
 * One box in the editor can hold several paragraphs separated by a blank
 * line. Without this split they render as one run-on block, because each
 * array item becomes exactly one <p>.
 */
const paragraphs = (v: unknown): string[] => {
  const list = strList(v).flatMap((s) => s.split(/\r?\n\s*\r?\n/));
  const cleaned = list.map((s) => s.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [DEFAULTS.bio];
};

const DEFAULTS = {
  name: "Lilly Patterson",
  tagline: "Illustration · Visual Development",
  description: "Portfolio of Lilly Patterson — illustrator and visual development artist.",
  email: "lillybpatterson@gmail.com",
  bio: "Illustrator and visual development artist.",
  location: "Atlanta, GA",
  program: "MFA Illustration, SCAD Atlanta",
};

export const site = {
  name: str(raw.name, DEFAULTS.name),
  tagline: str(raw.tagline, DEFAULTS.tagline),
  description: oneLine(raw.description, DEFAULTS.description),
  email: str(raw.email, DEFAULTS.email),

  /* The canonical address. The apex domain 307-redirects here, so this must
     stay on www — it is what sitemap.ts, robots.ts and every Open Graph tag
     advertise. */
  url: "https://www.lillybpatterson.com",

  social: socialLinks(raw.social),

  /* The top navigation. Order = order shown. */
  nav: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ] as { label: string; href: string }[],

  about: {
    /* Each item is one paragraph on the /about page. */
    bio: paragraphs(raw.bio),
    location: str(raw.location, DEFAULTS.location),
    program: str(raw.program, DEFAULTS.program),
  },

  /* Slugs shown in the "a few favorites" strip on the home page, in order.
     The hero piece appears above this and is never repeated here — see
     featuredProjects() in projects.ts. Slugs matching no project are skipped,
     and build-manifest warns about them by name. */
  homeFavorites: strList(raw.homeFavorites),
};

export type Site = typeof site;
