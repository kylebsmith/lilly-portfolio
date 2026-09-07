/* ───────────────────────────────────────────────────────────
 *  ✦ Site settings ✦
 *
 *  MOST OF THIS FILE IS NO LONGER EDITED BY HAND.
 *
 *  Your name, tagline, bio, email, social links and homepage
 *  favorites now live in `site-content.json`, right next to this
 *  file — and you edit them in the website editor at /admin,
 *  under "About & Contact". You never need to open either file.
 *
 *  Two values deliberately stay here in code, where the editor
 *  cannot reach them, because a typo in either one breaks the
 *  whole site rather than one page:
 *
 *    url  — feeds new URL() in layout.tsx and every sitemap entry.
 *           A malformed value throws at build time.
 *    nav  — the top navigation. A bad href here is a broken link
 *           on every single page.
 *  ───────────────────────────────────────────────────────── */

import content from "./site-content.json";

export const site = {
  name: content.name,
  tagline: content.tagline,
  description: content.description,
  email: content.email,

  /* The canonical address. The apex domain 307-redirects here, so this
     must stay on www — it is what sitemap.ts, robots.ts and every Open
     Graph tag advertise. */
  url: "https://www.lillybpatterson.com",

  social: content.social,

  /* The top navigation. Order = order shown. */
  nav: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],

  about: {
    /* Each item is one paragraph on the /about page. */
    bio: content.bio,
    location: content.location,
    program: content.program,
  },

  /* Slugs shown in the "a few favorites" strip on the home page, in order.
     The hero piece (the top project) appears above this and is not repeated.
     Slugs that match no project are silently skipped. */
  homeFavorites: content.homeFavorites,
} as const;

export type Site = typeof site;
