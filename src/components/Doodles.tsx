/**
 * Hand-drawn SVG ornaments. Each draws itself in via CSS animation when
 * scrolled into view. Use sparingly — they're personality, not decoration.
 *
 * Available:
 *   <Doodle.Circle />     — a wobbly hand-drawn circle (highlights)
 *   <Doodle.Arrow />      — sketched arrow (points at things)
 *   <Doodle.Underline />  — wavy underline
 *   <Doodle.Star />       — a star ornament
 *   <Doodle.Scribble />   — a quick squiggle
 */

import type { CSSProperties } from "react";

type Props = { className?: string; style?: CSSProperties };

const Circle = ({ className, style }: Props) => (
  <svg viewBox="0 0 200 200" className={className} style={style} fill="none" aria-hidden>
    <path
      d="M100 8 C 150 12, 192 50, 192 100 S 160 188, 100 192 S 8 152, 8 100 S 50 8, 100 8"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeDasharray="0.5 4"
      pathLength="1"
      style={{ strokeDasharray: "1 1", strokeDashoffset: 1, animation: "draw 1.4s var(--ease-out-quint) forwards" }}
    />
  </svg>
);

const Arrow = ({ className, style }: Props) => (
  <svg viewBox="0 0 200 80" className={className} style={style} fill="none" aria-hidden>
    <path
      d="M5 60 C 40 25, 90 8, 150 28 C 165 33, 175 42, 178 55"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      pathLength="1"
      style={{ strokeDasharray: "1 1", strokeDashoffset: 1, animation: "draw 1.2s var(--ease-out-quint) forwards" }}
    />
    <path
      d="M178 55 L 168 38 M178 55 L 158 60"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      pathLength="1"
      style={{ strokeDasharray: "1 1", strokeDashoffset: 1, animation: "draw .6s var(--ease-out-quint) 1s forwards" }}
    />
  </svg>
);

const Underline = ({ className, style }: Props) => (
  <svg viewBox="0 0 240 12" preserveAspectRatio="none" className={className} style={style} fill="none" aria-hidden>
    <path
      d="M3 7 C 50 2, 110 11, 160 5 S 232 9, 237 4"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      pathLength="1"
      style={{ strokeDasharray: "1 1", strokeDashoffset: 1, animation: "draw 1.2s var(--ease-out-quint) forwards" }}
    />
  </svg>
);

const Star = ({ className, style }: Props) => (
  <svg viewBox="-22 -22 44 44" className={className} style={style} fill="currentColor" aria-hidden>
    <path d="M0 -18 C 4 -6, 6 -4, 18 0 C 6 4, 4 6, 0 18 C -4 6, -6 4, -18 0 C -6 -4, -4 -6, 0 -18 Z" />
  </svg>
);

const Wave = ({ className, style }: Props) => (
  <svg viewBox="0 0 600 16" preserveAspectRatio="none" className={className} style={style} fill="none" aria-hidden>
    <path
      d="M2 8 C 50 1, 100 15, 150 8 C 200 1, 250 15, 300 8 C 350 1, 400 15, 450 8 C 500 1, 550 15, 598 8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      pathLength="1"
      style={{ strokeDasharray: "1 1", strokeDashoffset: 1, animation: "draw 1.6s var(--ease-out-quint) forwards" }}
    />
  </svg>
);

/**
 * A small 4-arm star. Strokes in like a sketch, then loops a slow,
 * subtle pulse so it feels alive without being distracting.
 */
const Twinkle = ({ className, style }: Props) => (
  <svg
    viewBox="-22 -22 44 44"
    className={className}
    style={{ ...style, animation: "twinkle 3.6s ease-in-out infinite" }}
    fill="none"
    aria-hidden
  >
    <path
      d="M0 -16 L 0 16 M -16 0 L 16 0 M -11 -11 L 11 11 M -11 11 L 11 -11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      pathLength="1"
      style={{ strokeDasharray: "1 1", strokeDashoffset: 1, animation: "draw 1s var(--ease-out-quint) forwards" }}
    />
  </svg>
);

const Scribble = ({ className, style }: Props) => (
  <svg viewBox="0 0 160 60" className={className} style={style} fill="none" aria-hidden>
    <path
      d="M5 40 C 25 20, 35 50, 55 30 S 85 50, 105 28 S 145 48, 155 26"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      pathLength="1"
      style={{ strokeDasharray: "1 1", strokeDashoffset: 1, animation: "draw 1.5s var(--ease-out-quint) forwards" }}
    />
  </svg>
);

export const Doodle = {
  Circle,
  Arrow,
  Underline,
  Wave,
  Twinkle,
  Star,
  Scribble,
};

/**
 * Drop-in keyframes — appended to globals.css would also work, but keeping
 * them co-located makes the component self-contained.
 */
export const DoodleKeyframes = () => (
  <style>{`
    @keyframes draw {
      to { stroke-dashoffset: 0; }
    }
  `}</style>
);
