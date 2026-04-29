"use client";

import { motion, useReducedMotion } from "motion/react";
import { Fragment } from "react";

/**
 * Disciplines along a gentle SVG path on tablet/desktop, and a plain
 * centered italic line on mobile (where SVG textPath would be too
 * small to read).
 */

const ITEMS = [
  "Visual Development",
  "Illustration",
  "Character Design",
];

export default function DisciplineRibbon() {
  const reduced = useReducedMotion();

  return (
    <section
      className="container-edge mx-auto max-w-[1700px] py-10 md:py-16"
      aria-label="Disciplines"
    >
      {/* Mobile: plain centered italic line */}
      <motion.p
        initial={reduced ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="lp-italic block text-center text-2xl tracking-tight md:hidden"
      >
        {ITEMS.map((word, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <span className="mx-2 not-italic text-[color:var(--accent)]">✦</span>
            )}
            {word}
          </Fragment>
        ))}
      </motion.p>

      {/* Desktop: curved textPath ribbon */}
      <motion.svg
        viewBox="0 0 1800 140"
        preserveAspectRatio="xMidYMid meet"
        className="hidden w-full text-[color:var(--fg)] md:block"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      >
        <defs>
          {/* Soft single arch — endpoints y=100, peak only y=70 (30-unit rise) */}
          <path id="ribbon-curve" d="M 60 100 Q 900 70 1740 100" fill="none" />
        </defs>
        <text
          textAnchor="middle"
          fill="currentColor"
          style={{
            fontFamily: "var(--font-italic)",
            fontStyle: "italic",
            fontSize: 64,
            letterSpacing: "-0.02em",
          }}
        >
          <textPath href="#ribbon-curve" startOffset="50%">
            {ITEMS.map((word, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <tspan
                    fill="var(--accent)"
                    style={{ fontStyle: "normal" }}
                  >
                    {"  ✦  "}
                  </tspan>
                )}
                <tspan>{word}</tspan>
              </Fragment>
            ))}
          </textPath>
        </text>
      </motion.svg>

      {/* Screen reader fallback (the SVG is aria-hidden) */}
      <p className="sr-only">{ITEMS.join(" · ")}</p>
    </section>
  );
}
