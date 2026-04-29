# How to update your website

Hi Lilly. **You will never need to touch code.** Everything is folder
management and a tiny text file. Read this once, refer back when needed.

---

## ✦ The whole site in one picture

```
public/work/
  01_dnd-style-frame/
    cover.jpg                   ← thumbnail (always named "cover.jpg")
    azael-design.jpg            ← extra images = documentation
    _meta.txt                   ← title / category / year
  02_breath-of-life/
    cover.jpg
    mockup.png
    _meta.txt
  03_…
```

That's the whole pattern. Add a folder = add a project. Drop a file in
that folder = it shows up. Done.

Plus two side things:

- `public/about/` — your portrait + a couple personal sketches that
  appear on the About page
- `content/site.ts` — your bio, email, social links

---

## ✦ Add a new project (3 steps, ~2 minutes)

### 1. Make the folder

In `public/work/`, create a new folder. Name format:

```
##_some-name
```

- `##` is a two-digit number (`01`, `02`…) — controls **order on the site**
- `some-name` is the URL slug — lowercase, hyphens, no spaces

> **Important:** the folder prefixed `01_*` becomes the **home page hero**.
> Pick your strongest piece for that slot.

Example: `04_dragon-hunt`

### 2. Drop your files in

| File type | What it does |
|---|---|
| **Images** (`.jpg`, `.png`, `.webp`) | The one named `cover.jpg` is the thumbnail. Other images appear on the project page in alphabetical order, below the lead. |
| **Videos** (`.mp4`, `.mov`) | Render as inline players in the documentation strip. Compress them first (see below). |
| `_meta.txt` | Three lines of plain text — title, category, year. |

### 3. Photoshop metadata fills in the rest automatically

If you fill in **File → File Info…** in Photoshop before exporting,
the website pulls these from the JPG itself:

| Photoshop field | What appears on the site |
|---|---|
| **Description** (the text box) | The blurb under the title — write a short artist statement. Class codes / instructor / email are filtered out. |
| **Document Title** | Captured for record-keeping (not currently displayed) |
| **Author** | Captured for record-keeping |
| **Copyright** | Captured for record-keeping (the site footer credits you) |
| Image **Resolution** (Image Size dialog) | Becomes the "Size" field — e.g. 350 dpi at 3000×2265 px → "8.6 × 6.5 in" |
| Photoshop's **Created Date** | Becomes the "Date" field (e.g. "January 2026") |
| The fact you used **Photoshop / Illustrator / Procreate** | Becomes the "Medium" field — auto-mapped to "Digital" / "Digital (Procreate)" / etc. |

You can also write the medium explicitly in the Description field as a
line by itself (e.g. "Watercolor" or "Gouache") and the site will use it.

### 4. `_meta.txt`

Plain text. Edit in TextEdit, VS Code, or anywhere. **No quotes, no
commas, no brackets.**

```
title: The Dragon Hunt
category: character-design
year: 2026
```

That's all you need. If Photoshop already has a Description, **don't add
a `blurb:` line** — the site auto-pulls your Description as the blurb.
If Photoshop doesn't have a Description and you want to write a custom
one, add a `blurb: …` line.

**Categories** — exactly one per project:
- `character-design`
- `environments`
- `book-illustration`
- `sketch-book`

### 5. Push to GitHub

If you're using github.com directly: drag-and-drop the folder, write
a quick commit message, click Commit changes.

The site rebuilds itself in about 60 seconds. Done.

---

## ✦ Adding a video / timelapse

**Two ways**, depending on size:

### Option A — Drop the file into the folder (easiest)

If your video is **under ~30 MB**, just drop it (`.mp4` works best) into
the project folder alongside the images. The site will render it as an
inline player in the documentation strip.

### Option B — Embed from Vimeo (recommended for big files)

For longer timelapses or anything over 30 MB, **upload to Vimeo** (free)
and paste the URL into `_meta.txt`:

```
title: Magic City Painting
category: book-illustration
year: 2026
video: https://vimeo.com/123456789
```

The site will render a Vimeo player on the project page. Vimeo handles
the bandwidth, so your hosting bill stays small.

> **Why this matters:** Vercel (where the site is hosted) gives 100 GB
> of free bandwidth a month. A 600 MB video served a few hundred times
> would burn through that fast. Vimeo solves this for you, free.

If you want to compress a big `.mp4` before uploading: open it in
QuickTime → File → Export As → 1080p (or use [HandBrake](https://handbrake.fr/),
free). 1280×720 at "fast 1080p30" preset is plenty for web.

---

## ✦ Reorder projects

Just rename the folders. Want `dragon-hunt` to show first? Rename it
to `01_dragon-hunt` and bump everyone else.

---

## ✦ Remove a project

Delete the folder, or rename it with a `_` prefix (`_archived_dragon-hunt`)
and the site will skip it but keep the files around.

---

## ✦ Change your bio, email, or social links

Open [`content/site.ts`](content/site.ts), find the value, edit between
the quotes, save. The file has comments to walk you through.

The same file has a `homeFavorites:` array — list the slugs of the
three projects you want featured on the home page below the hero.

---

## ✦ Replace your portrait

Drop a JPG at `public/about/portrait.jpg` (or .png) and update the
src in `src/app/about/page.tsx`. One line.

The two small sketches on the About page next to the portrait are
`public/about/burger-at-desk.jpg` and `public/about/license-plate.png` —
swap those filenames if you want different ones there.

---

## ✦ Two ways to actually do all of this

### A) The browser (zero install)

1. Go to your repo at `github.com/YOUR_USER/lilly-portfolio`.
2. Navigate into `public/work/`.
3. Click **Add file → Upload files** to upload an entire new folder, or
   click any existing file and the pencil icon (✏️) to edit `_meta.txt`.
4. Scroll down, write a short message, click **Commit changes**.
5. Vercel rebuilds. Live in ~60 seconds.

### B) Your computer (VS Code + GitHub Desktop)

Slightly more powerful — useful for uploading 10+ files at once or
previewing the change locally before pushing.

Install [GitHub Desktop](https://desktop.github.com/) once, clone the
repo, edit files in Finder + TextEdit, then commit & push from Desktop.

---

## ✦ If you break something

Every change is a commit, and every commit is reversible.

1. On github.com, click **Commits** at the top of your repo.
2. Find the bad commit → click **Revert**.
3. Site goes back to how it was.

You cannot lose work permanently.

---

## ✦ The naming convention, one more time

- Folder: `##_slug-name/`
- Inside: image files + optional video files + `_meta.txt`
- Whichever image is `cover.jpg` becomes the thumbnail
- `_meta.txt` has `title:`, `category:`, `year:`, optional `video:` (Vimeo URL)
- Photoshop File Info → fills in medium / size / date / blurb automatically

That's the entire system.

---

## ✦ Categories

| Slug | Label |
|---|---|
| `character-design` | Character Design |
| `environments` | Environments |
| `book-illustration` | Book Illustration |
| `sketch-book` | Sketchbook |

If you want a new category, ping the developer who built this — it's
six lines of code in one file.

---

## ✦ "What if I want a fancier editor someday?"

Layer on a free CMS later if you ever want a form-based UI:
- **[TinaCMS](https://tina.io)** — visual editor on top of these exact same folders
- **[Decap CMS](https://decapcms.org/)** — same idea, free, lighter

Both work *with* this setup, not against it. No migration needed.
