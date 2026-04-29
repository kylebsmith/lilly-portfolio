"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { site } from "@content/site";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/cn";

/**
 * Top-left wordmark + top-right pill nav.
 *
 *  Wordmark behavior:
 *    - On the home page while still over the hero image → forced WHITE
 *      (so it pops against the dark hero artwork)
 *    - Anywhere else (or scrolled past hero) → theme-reactive
 *      (dark in light mode, cream in midnight mode)
 *
 *  Pill nav:
 *    - Locked to light styling in BOTH themes via `color-scheme: light`,
 *      which also tells extensions like Dark Reader to leave it alone.
 *    - All text colors are explicit hex — no CSS-var dependency, so the
 *      pill never shifts when the theme toggles.
 */

const UNLOCK_THRESHOLD = 5;
const UNLOCK_WINDOW_MS = 1800;

export default function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const clicksRef = useRef<number[]>([]);
  const [popped, setPopped] = useState(false);
  // True when the wordmark is sitting over the hero image (home + near top)
  const [overHero, setOverHero] = useState(isHome);

  useEffect(() => {
    if (!isHome) {
      setOverHero(false);
      return;
    }
    const onScroll = () =>
      setOverHero(window.scrollY < window.innerHeight * 0.65);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const recordClick = () => {
    const now = performance.now();
    clicksRef.current = [...clicksRef.current, now].filter(
      (t) => now - t < UNLOCK_WINDOW_MS
    );
    if (clicksRef.current.length >= UNLOCK_THRESHOLD) {
      clicksRef.current = [];
      window.dispatchEvent(new CustomEvent("lp:rainbow-unlock"));
      setPopped(true);
      window.setTimeout(() => setPopped(false), 1400);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="container-edge mx-auto flex max-w-[1700px] items-center justify-between pt-5 md:pt-7">
        {/* Wordmark: gold-glow over the hero (pops against the dark artwork
            and ties to the ✦ icon), theme-reactive elsewhere. Soft drop
            shadow keeps it legible against bright spots in the artwork. */}
        <Link
          href="/"
          data-cursor
          aria-label="Home"
          onClick={recordClick}
          className={cn(
            "group inline-flex items-baseline gap-1.5 font-display text-base uppercase tracking-[0.18em] transition-colors duration-500",
            overHero
              ? "text-[#e2b865] [text-shadow:_0_2px_18px_rgba(0,0,0,0.55),_0_1px_2px_rgba(0,0,0,0.4)]"
              : "text-[color:var(--fg)]"
          )}
        >
          <span className={overHero ? "text-[#f0cc7a]" : "text-[color:var(--accent)]"}>✦</span>
          <span className="transition-colors duration-500 group-hover:text-[color:var(--accent)]">
            lilly p.
          </span>
          <AnimatePresence>
            {popped && (
              <motion.span
                key="pop"
                initial={{ scale: 0, rotate: -16, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
                className="ml-1 font-hand text-base normal-case tracking-normal text-[color:var(--accent)]"
              >
                ✦ unlocked
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Top-right pill nav. Theme-reactive via CSS variables:
            - light mode: cream pill + dark text
            - midnight mode: slate pill + cream text
            Both readable in their respective theme — the pill is always
            distinct from the page bg and the text always reads. */}
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1 rounded-full border bg-[color:var(--pill-bg)] px-1.5 py-1 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]"
              style={{ borderColor: "var(--pill-border)" }}>
            {site.nav.map((item) => {
              const href: string = item.href;
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    data-cursor
                    className={cn(
                      "relative inline-block rounded-full px-3.5 py-2 text-xs uppercase tracking-[0.2em] transition-colors duration-300"
                    )}
                    style={{
                      color: active
                        ? "var(--pill-text-active)"
                        : "var(--pill-text)",
                    }}
                  >
                    {item.label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-[color:var(--accent)]"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
            <li className="ml-1 pl-1" style={{ borderLeft: "1px solid var(--pill-border)" }}>
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
