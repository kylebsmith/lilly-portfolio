# Maintenance — for Kyle (or whoever comes next)

Everything Lilly needs is in [CONTENT.md](CONTENT.md). This file is the
other half: the things she can't do, the things that rot, and how to fix
the site when something is actually wrong.

---

## The most likely future problem: her token expires

GitHub fine-grained tokens **expire, at most 366 days out**. When hers
does, `/admin` asks her to sign in again and nothing she does works until
she makes a new one.

**This is the single most likely way she loses access.** It is not an
emergency and nothing is lost — but she will not connect "the editor
won't let me in" to "a token from a year ago expired" on her own.

Fix: walk her through the four steps at the top of CONTENT.md again. It
takes two minutes.

If you want to remove this failure mode permanently, replace PAT sign-in
with a GitHub App / OAuth flow. That means hosting an OAuth proxy —
more moving parts, but no annual expiry.

---

## Restoring something

**Nothing is ever really lost.** Every CMS save is a git commit.

```bash
git log --oneline -- public/work/<folder>          # what happened to this piece
git log --diff-filter=D --name-only | grep <file>  # when something was removed
git checkout <commit>^ -- public/work/<folder>     # bring it back
```

She has no Delete button (`delete: false` in `public/admin/config.yml`),
so the realistic cases are an overwritten field or a replaced image, both
of which are one `git checkout` away.

---

## "The site didn't update"

Almost always a content validation error, and that is the system working:
**Vercel keeps serving the previous deploy, so visitors never see a broken
site.**

```bash
npm run check-content     # same validation the deploy runs, with the messages
```

The message names the piece and what to fix. If she is stuck, telling her
to set that piece to **Hidden** and save always clears it — `hidden` is
checked before validation for exactly this reason.

---

## Upgrading Sveltia CMS

The bundle is **vendored** at `public/admin/sveltia-cms.js` — committed,
served from our own domain, so no CDN outage can take her editor offline.
The cost is that upgrades are manual.

```bash
npm pack @sveltia/cms@<version>
tar xzf sveltia-cms-<version>.tgz
cp package/dist/sveltia-cms.js public/admin/sveltia-cms.js
shasum -a 256 public/admin/sveltia-cms.js      # record it in index.html's comment
```

Then load `/admin`, confirm it boots and the project list renders, and
check the browser console for config warnings. The current pinned version
and its hash are in the comment at the bottom of `public/admin/index.html`.

There is no security-patch channel for a vendored file. Check for updates
when you touch this project; it holds a `contents:write` token in
localStorage and talks to api.github.com.

---

## Changing the design

Lilly controls the accent colours (`content/theme.json`, validated by
`src/lib/theme.ts`). Everything else is code:

- **Colours / spacing / type scale** — `src/app/globals.css`, the `@theme`
  block and the `:root` / `[data-theme="midnight"]` variables.
- **Fonts** — `src/app/layout.tsx`, via `next/font/google`. Exposing font
  choice to the CMS is possible but means shipping every option's webfont,
  so it costs page weight on a site whose whole job is loading images fast.
- **Adding a category** — three places, all of which must agree:
  1. `content/projects.ts` — the `Category` union and `VISIBLE_CATEGORIES`
  2. `content/projects.ts` — `CATEGORY_LABELS`
  3. `public/admin/config.yml` — the `category` select options
  An unknown category is a hard build error, so a mismatch fails loudly
  rather than silently dropping a piece off the filters.

---

## Media policy

The repo is ~300 MB, most of it artwork. That is fine, but:

- **Video is the thing to watch.** 78 MB of it is committed. Anything
  long belongs on Vimeo (`video:` in `_meta.txt` renders an embed). The
  CMS hints at this, and `ProjectVideo` only loads a clip once it scrolls
  into view, so an unwatched video costs nothing.
- **GitHub hard-rejects any file over 100 MB.** The CMS caps uploads at
  10 MB, so she cannot hit it; you can, from the command line.
- Git history is permanent. Removing a large file later does not shrink a
  clone — only a history rewrite does, and that breaks every existing
  clone.

---

## Vercel

Free Hobby plan: 100 GB bandwidth/month. The lazy-loading video fix
removed the main risk (a single 40 MB clip was previously downloaded by
every visitor to that page, whether they watched it or not).

> **Worth knowing:** Vercel's Hobby plan is for non-commercial use, and
> their definition of commercial includes being paid to build or host the
> site. The site itself says "open for commissions". If that ever becomes
> a problem, Pro is $20/month. Flagging it because it is a terms issue,
> not a technical one.

---

## This Mac specifically

`node_modules` on this machine keeps accumulating `" 2"` duplicate files —
799 of them at last count, still multiplying while work was in progress.
It is not iCloud (`~/Documents` is not a synced zone) and there is no
Dropbox/OneDrive; something else — a backup agent or antivirus — is
watching that folder.

It has already broken a build once (`next build` died on a missing module,
and an empty `@types/node 2` directory made TypeScript fail with
"Cannot find type definition file for 'node 2'").

**The source tree is unaffected, and Vercel builds in a clean container,
so the live site is never at risk.** If a local build fails strangely:

```bash
rm -rf node_modules && npm ci
find node_modules -name "* 2" -maxdepth 2   # check whether they came back
```

Worth finding what is doing it.

---

## Before pushing a pipeline change

```bash
cp content/_manifest.json /tmp/before.json
npm run manifest && node scripts/diff-manifest.mjs /tmp/before.json   # expect zero diffs
npm test                                                             # expect 33 passing
npm run build
```
