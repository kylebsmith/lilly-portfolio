import raw from "@content/theme.json";

/**
 * The handful of colours Lilly can change from the editor's "Look & Feel"
 * panel. They are the accent tones — the gold used for underlines, highlights,
 * buttons, the ✦ mark and hover states — in each of the two themes.
 *
 * Everything here is defensive on purpose. These values arrive from a JSON file
 * a non-developer edits, and this site is her live portfolio: a typo must never
 * be able to take a page down or render invisible text. Anything that isn't a
 * valid CSS hex colour silently falls back to the original design value.
 *
 * Deliberately NOT exposed: page background and body text. Letting those be set
 * independently is how you end up with cream text on cream paper, and there is
 * no way for her to tell that happened without loading every page.
 */

export type Theme = {
  accent: string;
  accentGlow: string;
  accentDark: string;
  accentGlowDark: string;
};

/** The shipped design values. Also the fallback for anything invalid. */
export const DEFAULT_THEME: Theme = {
  accent: "#b88a3e",
  accentGlow: "#e2b865",
  accentDark: "#e2b865",
  accentGlowDark: "#f0cc7a",
};

/** #rgb, #rgba, #rrggbb or #rrggbbaa — nothing else gets into the stylesheet. */
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const pick = (value: unknown, fallback: string): string =>
  typeof value === "string" && HEX.test(value.trim()) ? value.trim() : fallback;

/**
 * Through `unknown` deliberately. TypeScript infers a JSON import's LITERAL
 * shape, so casting straight to Partial<Theme> makes the build fail the moment
 * the file holds a null or a number — exactly the malformed input this module
 * exists to absorb. Widening first keeps the fallback path reachable.
 */
const data = raw as unknown as Record<string, unknown>;

export const theme: Theme = {
  accent: pick(data.accent, DEFAULT_THEME.accent),
  accentGlow: pick(data.accentGlow, DEFAULT_THEME.accentGlow),
  accentDark: pick(data.accentDark, DEFAULT_THEME.accentDark),
  accentGlowDark: pick(data.accentGlowDark, DEFAULT_THEME.accentGlowDark),
};

/**
 * The override block injected into <head>.
 *
 * `html:root` rather than `:root` so it outranks globals.css regardless of the
 * order Next emits the stylesheet and this tag; same reason for the doubled
 * selector on the midnight variant.
 */
export const themeCss = (t: Theme = theme): string =>
  `html:root{--accent:${t.accent};--accent-glow:${t.accentGlow}}` +
  `html:root[data-theme="midnight"]{--accent:${t.accentDark};--accent-glow:${t.accentGlowDark}}`;
