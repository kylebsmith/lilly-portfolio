"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

/**
 * Decorative drifting ornaments. Mounted client-side only to avoid
 * float-precision hydration mismatches in inline style numbers.
 */

const Star = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12 0c.7 5 1.5 5.8 6.5 6.5 0 0-5.8.7-6.5 6.5 0 0-.7-5.8-6.5-6.5C10.5 5.8 11.3 5 12 0z" />
    <path
      d="M19 12c.5 3.5 1.1 4 4.6 4.5 0 0-4.1.5-4.6 4.6 0 0-.5-4.1-4.6-4.6C17.9 16 18.5 15.5 19 12z"
      opacity=".7"
    />
  </svg>
);

type Mark = {
  id: number;
  left: string;
  top: string;
  size: number;
  delay: number;
  dur: number;
  opacity: number;
};

export default function Sparkles({
  count = 14,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const marks = useMemo<Mark[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = (i + 1) * 7919;
      const r = (n: number) => (Math.sin(seed * n) + 1) / 2;
      // Pre-format strings so SSR and client render identical markup.
      return {
        id: i,
        left: `${(r(1) * 100).toFixed(2)}%`,
        top: `${(r(2) * 100).toFixed(2)}%`,
        size: Math.round(8 + r(3) * 18),
        delay: Number((r(4) * 6).toFixed(2)),
        dur: Number((5 + r(5) * 6).toFixed(2)),
        opacity: Number((0.25 + r(6) * 0.4).toFixed(2)),
      };
    });
  }, [count]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden text-[color:var(--accent)] ${className}`}
    >
      {marks.map((m) => (
        <motion.span
          key={m.id}
          className="absolute"
          style={{ left: m.left, top: m.top, opacity: m.opacity }}
          animate={
            reduced
              ? undefined
              : {
                  y: [0, -10, 0],
                  rotate: [0, 14, 0],
                  scale: [1, 1.1, 1],
                }
          }
          transition={{
            duration: m.dur,
            delay: m.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Star size={m.size} />
        </motion.span>
      ))}
    </div>
  );
}
