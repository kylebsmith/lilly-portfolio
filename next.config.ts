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
    deviceSizes: [320, 480, 640, 768, 1024, 1280, 1536, 1920, 2560],
    imageSizes: [16, 32, 64, 96, 128, 256, 384, 512, 768],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["motion", "gsap"],
  },
};

export default config;
