# Maintenance — for Kyle (or whoever comes next)

Everything Lilly needs is in [CONTENT.md](CONTENT.md). This file is the
other half: the things she can't do, the things that rot, and how to fix
the site when something is actually wrong.

---

## Vercel must know her too — not just GitHub

**Repo access is not enough.** Vercel's Hobby plan only builds commits whose
git author has access to the *Vercel project*. Lilly's first three edits
committed to GitHub perfectly and then failed to deploy with:

    Git author lillybpatterson-art must have access to the project on
    Vercel to create deployments.

Her content was valid — the full production build passed on all three — and
the site kept serving the previous version, so nothing broke. But her work was
invisible, and nothing in the editor told her why. From her side, she saved and
the site simply did not change.

**The fix is to add her to the Vercel project, which requires Pro** ($20/month).
Vercel dashboard → the `kyle-2447's projects` team → **Settings → Members →
Invite**, using the GitHub account `lillybpatterson-art`. Pro also settles the
non-commercial-terms question below, since the site advertises commissions.

**Stopgap if it happens again before that:** any commit authored by the account
owner makes Vercel build the current tree, including her unpublished work.

    git pull && git commit --allow-empty -m "Redeploy: publish Lilly's edits" && git push

**Rejected alternatives.** Deploy hooks do *not* help — Vercel reads the author
off the latest commit no matter how the build was triggered. The free
workaround is a GitHub Action that rewrites the author on the CI runner and
deploys via the Vercel CLI, which works but adds a workflow, three secrets and
a rotating Vercel token to a project whose whole point is being maintainable.

## Why she uses a CLASSIC token, not a fine-grained one

Sveltia's "Sign In Using Access Token" button deep-links to GitHub's
**fine-grained** token page. **That page cannot work for Lilly**, and the
failure is silent: fine-grained tokens only reach repositories owned by the
token creator's own account or an organization they belong to. This repo
belongs to Kyle's personal account with her added as a collaborator, so it
never appears in the repository picker. She would follow the button, find
nothing, and be stuck with no error to search for.

So `public/admin/index.html` shows a blue bar while signed out linking to
the **classic** token page instead, pre-filled with the `repo` scope, which
does work for a collaborator. The bar disappears once she is signed in.

The tradeoff: classic `repo` scope covers every repository she can access,
not just this one. Today that is only this repo, so the practical blast
radius is the same — but it will not stay true if she gets others.

**The clean long-term fix is to move this repo into a free GitHub
Organization.** Then she becomes an org member rather than a personal-account
collaborator, fine-grained tokens work, she can scope one to just this
repository, and Sveltia's own button becomes correct. It costs nothing and
takes about twenty minutes: create the org, transfer the repo, re-link the
Vercel project, enable fine-grained tokens in the org's settings, and update
the sign-in steps in CONTENT.md. Worth doing whenever this is next touched.

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

## Preview deployments and the editor

Every branch you push gets a Vercel preview at a temporary URL, and that
preview has a working `/admin` on it.

**The editor always publishes to `main`, whatever host it is served from.**
So a Save in a preview's editor reaches the real website. The preview is a safe
place to *look*, not to *save*.

The admin page detects this and shows a red bar on any host that is not
`www.lillybpatterson.com` (localhost is exempt — local-repository mode writes
to your working tree, not to GitHub).

To test saving safely, open `localhost:3000/admin` and choose **Work with
Local Repository**. It edits your checkout directly and commits nothing.

> A branch-aware config — generating `config.yml` at build time from
> `VERCEL_GIT_COMMIT_REF` so each preview writes to its own branch — was
> considered and rejected. It would make previews a true sandbox, but it turns
> a plain readable config file into a build artifact, and the warning bar
> closes the same footgun for a tenth of the complexity.

---

## Two accepted limitations

Both were found by adversarial testing, reproduced, and deliberately **not**
"fixed", because the available fixes cost more than the risk.

**The token is stored in cleartext in `localStorage`.** That is how Sveltia's
token sign-in works; there is no encrypted alternative short of patching the
vendored bundle. The blast radius is bounded — a fine-grained PAT with
`contents:write` on this one private repo, so the worst case is defacement of
the portfolio, and every commit is reversible. The `#/signin/<token>` URL
route, which would have let a crafted link plant a credential, IS disabled in
`public/admin/index.html`.

A forced re-login timer was considered and rejected: the token already expires
within 366 days, so a shorter TTL would multiply how often she has to
re-authenticate for a marginal gain. **The operational rule instead: she should
sign out from the editor if she ever uses a shared or borrowed computer.**

**Two devices saving at once can silently overwrite each other.** Sveltia
fetches the branch head *while building the commit* rather than using the head
it had when the page loaded, so its optimistic-concurrency check cannot catch a
change made in between. Fixing it properly means patching the minified 2 MB
bundle — which would break the sha256 provenance check, make every upgrade a
manual re-patch, and leave unreviewable code in the repo. Not worth it for a
site with one editor.

The practical rule: **don't edit from two places at the same time**, and if
Kyle is pushing changes, tell her to reload `/admin` before she saves. If it
ever does happen, nothing is lost — the overwritten version is still in git.

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
