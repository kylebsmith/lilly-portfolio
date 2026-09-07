# Lilly Patterson — Portfolio

Custom-built portfolio for illustrator & visual development artist Lilly
Patterson, replacing a Squarespace template.

Live at **https://www.lillybpatterson.com** (Vercel, deploys from `main`).

## Editing the site

**Lilly edits everything at [`/admin`](https://www.lillybpatterson.com/admin)** —
a Sveltia CMS instance. She never touches code. Her guide is
[CONTENT.md](CONTENT.md); it is the only document written for her.

## Run it locally

```bash
npm install        # once
npm run dev        # http://localhost:3000  (editor at /admin)
npm run build      # production build
npm test           # adversarial content-pipeline suite (33 cases)
```

`dev` and `build` both regenerate `content/_manifest.json` from
`public/work/` first. To refresh it alone: `npm run manifest`.

To try the CMS without touching GitHub, open `/admin` in Chrome and choose
**Work with Local Repository** — it edits your working tree directly.

## Stack

- **Next.js 16** App Router · React 19 · TypeScript · Turbopack — fully static
- **Tailwind CSS v4** with `@theme` design tokens
- **Motion** + **Lenis** for animation and smooth scroll
- **Sharp** + **exifr** at build time for image dimensions and Photoshop metadata
- **Sveltia CMS**, vendored — no CDN, no OAuth proxy, no database

## Layout

```
content/
  site-content.json     bio, email, social, homeFavorites   (CMS-owned)
  theme.json            accent colours                       (CMS-owned)
  site.ts               imports the above; url + nav stay in code
  projects.ts           types + selectors over the manifest
  _manifest.json        generated — do not edit

public/
  work/<folder>/        one folder per project
    _meta.txt             YAML: order, title, category, cover, gallery,
                          year, medium, size, date, layout, video,
                          blurb, hidden
    <images>              cover chosen by the `cover:` key
    <videos>              optional
  admin/                Sveltia CMS (index.html, config.yml, vendored bundle)

scripts/
  build-manifest.mjs    walks public/work, reads EXIF, validates, emits manifest
  diff-manifest.mjs     field-by-field manifest differ — the regression gate
  freeze-meta.mjs       makes implicit values explicit in _meta.txt (idempotent)
  torture-test.mjs      `npm test`
```

## How content flows

`public/work/*/_meta.txt` + image EXIF → `build-manifest.mjs` →
`content/_manifest.json` → `content/projects.ts` → pages.

Explicit `_meta.txt` values always beat EXIF-derived ones, which is why
`freeze-meta.mjs` can safely write derived values into the files: the
rendered output is unchanged.

### Two rules if you change the pipeline

1. **Gate every change** with `diff-manifest.mjs`. A refactor that is meant
   to preserve behavior must report zero field changes:
   ```bash
   cp content/_manifest.json /tmp/before.json
   # ...make the change...
   npm run manifest && node scripts/diff-manifest.mjs /tmp/before.json
   ```
2. **Run `npm test`.** It covers the failure modes a non-developer can
   actually create, including both hard-error paths and the `hidden`
   escape hatch.

### Validation policy

Hard errors fail the build, which means Vercel keeps serving the previous
deploy — a broken update never reaches visitors. They are reserved for
cases a person can clear from the CMS: unknown category, a present
`_meta.txt` with no title, a `_meta.txt` that parses to nothing. Everything
else warns. `hidden: true` is checked before validation, so it clears any
hard error — that is what makes hard errors safe.

## Maintenance

[MAINTENANCE.md](MAINTENANCE.md) — token renewal, restoring content,
upgrading the vendored CMS bundle, adding a category, media policy, and
the local `node_modules` corruption on this Mac.

## Deploy

See [DEPLOY.md](DEPLOY.md). Push to `main`; Vercel builds in ~60s.
