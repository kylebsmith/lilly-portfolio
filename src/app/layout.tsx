import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Caveat,
} from "next/font/google";
import { site } from "@content/site";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import PageTransition from "@/components/PageTransition";
import ScrollProgress from "@/components/ScrollProgress";
import ClickSparkle from "@/components/ClickSparkle";
import LightboxProvider from "@/components/Lightbox";
import CatchToast from "@/components/CatchToast";
import { themeCss } from "@/lib/theme";
import "./globals.css";

// Primary display — variable axes (wdth, wght, opsz). Chunky-confident
// at high weight + 100 width; elegant when extended. The contemporary
// "post-Inter" display face.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-loaded",
  display: "swap",
  axes: ["wdth", "opsz"],
});

// Italic accent — used only for the "personality moments" (bursts of
// italic in headlines).
const italic = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-italic-loaded",
  display: "swap",
});

const body = Geist({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  display: "swap",
});

const hand = Caveat({
  subsets: ["latin"],
  variable: "--font-hand-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${italic.variable} ${body.variable} ${mono.variable} ${hand.variable}`}
    >
      <head>
        {/* Accent colours from the editor's "Look & Feel" panel. Validated in
            lib/theme.ts — anything that isn't a hex colour falls back to the
            shipped design value, so a typo here can never break a page. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
        {/* Applies the saved theme BEFORE first paint.
            ThemeToggle also sets this, but it runs in an effect after
            hydration — so a visitor who chose midnight mode saw a flash
            of parchment on every single page load. This runs synchronously
            in <head>, so the correct theme is on the element before the
            browser paints anything. Wrapped in try/catch because
            localStorage throws in some privacy modes. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("lp.theme")==="midnight")' +
              'document.documentElement.dataset.theme="midnight"}catch(e){}',
          }}
        />
      </head>
      <body>
        <SmoothScroll />
        <ScrollProgress />
        <Cursor />
        <ClickSparkle />
        <LightboxProvider>
          <Nav />
          <PageTransition>
            <main className="relative z-10">{children}</main>
          </PageTransition>
          <Footer />
        </LightboxProvider>
        <CatchToast />
      </body>
    </html>
  );
}
