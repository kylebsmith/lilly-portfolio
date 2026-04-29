"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { site } from "@content/site";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/cn";

/**
 * Top-right horizontal nav. The wordmark sits subtly top-left and
 * doubles as the easter egg trigger (5 quick clicks → rainbow sparkles).
 *
 * Active state uses gold accent text + a thin underline — no bg fill,
 * which dodges the color-on-color trap.
 */

const UNLOCK_THRESHOLD = 5;
const UNLOCK_WINDOW_MS = 1800;

export default function Nav() {
  const pathname = usePathname();
  const clicksRef = useRef<number[]>([]);
  const [popped, setPopped] = useState(false);

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
        {/* Wordmark — small, refined, behaves like a site identifier rather than a logo */}
        <Link
          href="/"
          data-cursor
          aria-label="Home"
          onClick={recordClick}
          className="group inline-flex items-baseline gap-1.5 font-display text-base uppercase tracking-[0.18em] text-[color:var(--fg)]"
        >
          <span className="text-[color:var(--accent)]">✦</span>
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

        {/* Top-right nav — horizontal text links + theme toggle */}
        <nav aria-label="Primary">
          {/* The pill stays parchment + ink in BOTH themes — buttons don't
              flip in dark mode, so dark text always reads. Solid hex colors
              only (no /opacity modifier — that combo is unreliable on
              arbitrary hex values in Tailwind v4). */}
          <ul className="flex items-center gap-1 rounded-full border border-[#dccfb3] bg-[#fbf3dc] px-1.5 py-1 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]">
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
                      "relative inline-block rounded-full px-3.5 py-2 text-xs uppercase tracking-[0.2em] transition-colors duration-300",
                      active
                        ? "text-[#1a1208]"
                        : "text-[#5a4d3b] hover:text-[#1a1208]"
                    )}
                  >
                    {item.label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-[#b88a3e]"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
            <li className="ml-1 border-l border-[#dccfb3] pl-1">
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
