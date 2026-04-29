"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Click anywhere on the page → tiny sparkle burst at the cursor.
 * Subtle delight, not a confetti cannon. Disabled on touch devices
 * and respects reduced-motion.
 */

type Burst = { id: number; x: number; y: number; rainbow: boolean };

let nextId = 0;

export default function ClickSparkle() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const enabledRef = useRef(false);
  const rainbowUntilRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    enabledRef.current = true;

    const onClick = (e: MouseEvent) => {
      // Don't spawn while clicking input fields
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const id = ++nextId;
      const b: Burst = {
        id,
        x: e.clientX,
        y: e.clientY,
        rainbow: Date.now() < rainbowUntilRef.current,
      };
      setBursts((s) => [...s, b]);
      window.setTimeout(() => {
        setBursts((s) => s.filter((x) => x.id !== id));
      }, 900);
    };

    // Listen for the unlock event from the wordmark easter egg
    const onUnlock = () => {
      rainbowUntilRef.current = Date.now() + 12_000;
    };

    document.addEventListener("click", onClick);
    window.addEventListener("lp:rainbow-unlock", onUnlock);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("lp:rainbow-unlock", onUnlock);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[80]">
      <AnimatePresence>
        {bursts.map((b) => (
          <Spark key={b.id} x={b.x} y={b.y} rainbow={b.rainbow} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Spark({ x, y, rainbow }: { x: number; y: number; rainbow: boolean }) {
  // 6 little arms radiating
  const arms = useArms();
  const colorPool = rainbow
    ? ["#ff7eb6", "#ffb74d", "#ffe66d", "#9be36b", "#7ad9ff", "#c08bff"]
    : ["currentColor", "var(--accent-glow)"];

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 text-[color:var(--accent)]"
      style={{ left: x, top: y }}
    >
      <motion.svg
        width="44"
        height="44"
        viewBox="-22 -22 44 44"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {arms.map((a, i) => (
          <motion.line
            key={i}
            x1="0"
            y1="0"
            x2={a.x}
            y2={a.y}
            stroke={colorPool[i % colorPool.length]}
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
          />
        ))}
        <motion.circle
          r="2"
          fill={colorPool[0]}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.4, 0] }}
          transition={{ duration: 0.55 }}
        />
      </motion.svg>
    </div>
  );
}

function useArms() {
  // 6 arms at 0/60/120/… degrees with slight randomization per spawn
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (i * Math.PI) / 3 + (i % 2 ? 0.15 : -0.15);
    const len = 12 + (i % 3) * 2;
    return {
      x: Math.cos(angle) * len,
      y: Math.sin(angle) * len,
    };
  });
}
