import type { NextConfig } from "next";

const securityHeaders = [
  // Browser MIME-sniffing — keep it tight, browser respects what we say.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block embedding the site in iframes anywhere — clickjacking guard.
  { key: "X-Frame-Options", value: "DENY" },
  // Modern equivalent.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Don't leak full URLs cross-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features we'll never use from this origin.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Allow DNS prefetch (Vercel & Google Fonts benefit).
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Force HTTPS for a year — Vercel auto-issues certs, this completes the loop.
  // includeSubDomains is safe because the apex is the only host we serve.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 requires every quality value used in code to be declared here.
    // Undeclared values are silently clamped to the default 75 — which was
    // quietly downgrading the artwork this whole site exists to show.
    qualities: [75, 88, 90, 92, 95],
    deviceSizes: [320, 480, 640, 768, 1024, 1280, 1536, 1920, 2560],
    imageSizes: [16, 32, 64, 96, 128, 256, 384, 512, 768],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // The CMS admin page must never appear in search results. This header is
      // the authoritative signal (a robots.txt Disallow would be worse: it
      // stops crawlers fetching the page, so they'd never see the noindex).
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/admin",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  // Next.js serves public/admin/index.html only at the literal path
  // /admin/index.html. Bare /admin is a 404, and /admin/ redirects (308) to
  // /admin — straight into that 404. This rewrite makes the memorable URL work.
  async rewrites() {
    return [{ source: "/admin", destination: "/admin/index.html" }];
  },
  experimental: {
    optimizePackageImports: ["motion", "gsap"],
  },
};

export default config;
