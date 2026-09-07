# Deploy Lilly's site — start to finish

This guide assumes zero web-dev or DNS background.
If you can copy-paste, you can do this. Total time: ~30 minutes.

---

## Step 0 — Run it locally first (sanity check)

```bash
cd /Users/blotten/Documents/website/Lilly_Website
npm run dev
```

Open http://localhost:3000. Browse Home → Work → click a project → About → Contact. If everything looks right, move on.

To stop, hit `Ctrl+C` in the terminal.

---

## Step 1 — Push the code to GitHub

Vercel deploys directly from a Git repo. GitHub is free, Vercel reads from it automatically on every push.

1. Go to https://github.com/new
2. Name the repo something like `lilly-portfolio`. **Private** is fine — Vercel can still read it.
3. Don't tick "Add a README" or anything else. Empty repo.
4. Click **Create repository**. GitHub gives you a URL like `git@github.com:YOUR_USER/lilly-portfolio.git`.
5. Back in the terminal:

```bash
cd /Users/blotten/Documents/website/Lilly_Website
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin git@github.com:YOUR_USER/lilly-portfolio.git
git push -u origin main
```

Done. Code is on GitHub.

---

## Step 2 — Deploy to Vercel (free)

1. Go to https://vercel.com/signup. Sign up with the GitHub account from Step 1.
2. After login, click **Add New → Project**.
3. Vercel will list your GitHub repos. Pick `lilly-portfolio` and click **Import**.
4. **Framework preset** is auto-detected as Next.js. Don't change anything.
5. Click **Deploy**.

Wait ~90 seconds. You'll get a URL like `lilly-portfolio.vercel.app`. The site is live.

> **What's free here?**
> Vercel's Hobby plan: $0/month forever, 100 GB bandwidth, free SSL, global CDN, automatic image optimization. For a portfolio this is a *fraction* of what's available — Lilly will never hit a limit.

---

## Step 3 — Connect the domain `lillybpatterson.com`

There are two scenarios depending on **who currently registers the domain** (different from who hosts the site).

### A) If the domain is registered with Squarespace (most likely)

You're going to keep Squarespace as the registrar but stop them from serving the website. The DNS will point at Vercel.

#### A.1 — Take the Squarespace site offline gracefully

1. Log into Squarespace.
2. Go to **Settings → Site Availability**. Set the site to **Private** (this is the trick — Squarespace blocks domain disconnection while a site is "Live", but Private allows DNS to be redirected).
3. **Don't cancel the Squarespace plan yet.** Wait until the new site is verified working — then cancel from your billing page. You can still keep the domain registration after cancelling the site plan (Squarespace charges ~$20/yr for the domain alone, similar to GoDaddy).

#### A.2 — Add the domain to Vercel

1. In Vercel, open the project → **Settings → Domains**.
2. Type `lillybpatterson.com` and click **Add**. Then add `www.lillybpatterson.com` too.
3. Vercel shows you the DNS records to set. They'll be:
   - `A` record on `@` (the root) pointing to `76.76.21.21`
   - `CNAME` record on `www` pointing to `cname.vercel-dns.com`

#### A.3 — Set those records in Squarespace

1. In Squarespace: **Settings → Domains → lillybpatterson.com → DNS Settings**.
2. Find the existing `A` record on `@`. Change the value to `76.76.21.21`. (Delete any other A records on `@` — there are usually four old Squarespace IPs.)
3. Find or add a `CNAME` on `www` with value `cname.vercel-dns.com`.
4. **Do NOT touch any `MX` or `TXT` records.** Those are for email. Leaving them alone keeps email working.
5. Save.

#### A.4 — Wait for propagation

DNS takes anywhere from 5 minutes to a couple of hours. Vercel will show a green "Valid Configuration" badge when it's ready. Then https://lillybpatterson.com loads the new site.

### B) If the domain is at GoDaddy / Namecheap / somewhere else

Same idea, the menus are just in a different place.

1. In Vercel: **Settings → Domains → Add `lillybpatterson.com`**. Note the records.
2. In your registrar (GoDaddy: **My Products → DNS**):
   - Edit the `A` record on `@`: value `76.76.21.21`.
   - Edit/add the `CNAME` on `www`: value `cname.vercel-dns.com`.
   - Don't touch MX or TXT.
3. Wait. Done.

---

## Step 4 — Verify, then cancel Squarespace

Once https://lillybpatterson.com loads the new site (give it an hour):

1. Test the site on your phone (off WiFi, on cellular) to make sure DNS is propagated globally.
2. **Then** go cancel the Squarespace site plan.
3. Decide on the domain registrar:
   - **Easiest path:** leave the domain at Squarespace. Costs ~$20/yr. No further action.
   - **Cheapest path:** transfer the domain to **Cloudflare Registrar** ($10–11/yr at exact wholesale, free WHOIS privacy, free DNS). Cloudflare doesn't run promos and never marks up — they'll always be the cheapest. Transfer process is one form to fill out. Don't bother until 60 days after registration (ICANN rule for new domains; if it was registered ages ago you can transfer anytime).
   - GoDaddy is fine if she already has stuff there. They're slightly more expensive (~$22/yr) and the dashboard has more upsell pop-ups, but functionally it works.

**Squarespace was costing roughly $192–276/year.**
**New cost: $0 hosting + ~$10–22/year domain. Savings: ~$180–260/year.**

---

## Updating the site after launch

Push to `main` on GitHub → Vercel rebuilds and deploys automatically. About 60 seconds.

**Lilly does not use this flow.** She edits at
[`/admin`](https://www.lillybpatterson.com/admin) and the CMS commits for
her — see [CONTENT.md](CONTENT.md).

For a developer adding a project by hand:

1. Create `public/work/<slug>/` and drop the images in.
2. Add a `_meta.txt` with at least `title` and `category`
   (see [README.md](README.md) for every key).
3. `npm test && git commit && git push`. Live in about a minute.

To swap Lilly's portrait: replace `public/about/portrait.png` and update
`ABOUT_GALLERY` in `src/app/about/page.tsx` — the width/height there must
match the new file.

---

## Sanity reference — what's where

- **Domain registration** (who owns the name): Squarespace / GoDaddy / Cloudflare. Pays renewal.
- **DNS records** (the phone book that says "lillybpatterson.com → this server"): edited at the registrar.
- **Hosting** (the actual website files + CDN): Vercel.
- **Email** (lillybpatterson@gmail.com): Gmail. The `MX` records you don't touch keep that working — it's totally separate from web hosting.

These are three independent things. The user (Lilly) owns the domain forever as long as it renews — switching hosts is just changing two DNS records.
