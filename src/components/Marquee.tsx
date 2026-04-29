"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Plain CSS marquee. Slows on hover (subtle, not stopped — it should
 * still feel like motion you could lean into).
 */
export default function Marquee({
  items,
  speed = 60,
}: {
  items: string[];
  /** seconds per full pass — bigger = slower */
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const onChange = () => setReduced(m.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="group relative w-full overflow-hidden border-y border-current/10 py-7"
      onMouseEnter={() => ref.current?.style.setProperty("--marquee-mult", "2.4")}
      onMouseLeave={() => ref.current?.style.setProperty("--marquee-mult", "1")}
      style={{
        ["--marquee-dur" as string]: `${speed}s`,
        ["--marquee-mult" as string]: "1",
      }}
    >
      <div
        className="flex w-max items-center gap-12 whitespace-nowrap will-change-transform"
        style={
          reduced
            ? undefined
            : {
                animation:
                  "marquee calc(var(--marquee-dur) * var(--marquee-mult)) linear infinite",
              }
        }
      >
        {[...items, ...items, ...items].map((label, i) => (
          <span
            key={i}
            className="flex items-center gap-12 font-display text-3xl tracking-tight md:text-5xl"
          >
            <span className={i % 2 ? "italic text-[color:var(--accent)]" : ""}>
              {label}
            </span>
            <span aria-hidden className="text-xl text-[color:var(--accent)]">✦</span>
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-100% / 3)); }
        }
      `}</style>
    </div>
  );
}
