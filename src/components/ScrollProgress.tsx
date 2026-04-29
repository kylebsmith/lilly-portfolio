"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * 1px gold hairline at the very top of the viewport. Tracks scroll
 * progress with a soft spring — gives a "you are here" cue without
 * shouting.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX: x, transformOrigin: "0% 50%" }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-[color:var(--accent)] mix-blend-multiply"
    />
  );
}
