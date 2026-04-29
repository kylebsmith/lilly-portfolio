# Lilly Patterson — Portfolio

Custom-built portfolio for illustrator & visual development artist Lilly Patterson, replacing a Squarespace template.

## Editing the site

**For Lilly:** see [CONTENT.md](CONTENT.md). It's the only file you need to read.

## Run it locally

```bash
npm install        # once
npm run dev        # http://localhost:3000
npm run build      # production build
```

`npm run dev` and `npm run build` both regenerate `content/_manifest.json` from `public/work/` automatically. If you ever just want to refresh image dimensions without starting the server: `npm run manifest`.

## Stack

- **Next.js 15** App Router · React 19 · TypeScript · Turbopack
- **Tailwind CSS v4** with `@theme` design tokens
- **Motion** + **Lenis** for animation and smooth scroll
- **Sharp** at build time to auto-detect image dimensions

## Layout

```
content/                ← all editable content (Lilly edits these)
  site.ts                  bio, email, links, nav
  projects.ts              list of projects
  _manifest.json           auto-generated, do not edit

public/
  work/<slug>/             one folder per project — images live here
  about/                   portrait

scripts/
  build-manifest.mjs       reads image dimensions, writes _manifest.json

src/
  app/                     pages
  components/              UI components
  lib/                     small helpers
```

## Deploy

See [DEPLOY.md](DEPLOY.md). Vercel free tier, custom domain stays at the existing registrar — just two DNS records change.
