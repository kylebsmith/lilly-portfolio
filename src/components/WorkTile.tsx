"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { type Project, CATEGORY_LABELS } from "@content/projects";

/**
 * One project tile. Sits inside a JustifiedRows flex slot, where the
 * parent <div> already controls width via flex-grow proportional to
 * the image's aspect ratio. The tile itself fills that width.
 *
 *   - aspect-ratio'd container ensures image heights match across the row
 *   - sticker drop-shadow + alternating tilt stay
 *   - magnetic pointer pull stays
 *   - caption hangs below the image
 */
export default function WorkTile({
  project,
  index = 0,
  priority = false,
}: {
  project: Project;
  index?: number;
  priority?: boolean;
}) {
  const wrapRef = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  const tilt = reduced ? 0 : (index % 2 ? 0.7 : -0.9);

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (reduced) return;
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    setPos({ x: dx * 6, y: dy * 6 });
  };
  const onLeave = () => setPos({ x: 0, y: 0 });

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 32, rotate: tilt * 1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      whileHover={reduced ? undefined : { rotate: 0 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: 0.9, delay: (index % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/work/${project.slug}`}
        ref={wrapRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onContextMenu={(e) => {
          e.preventDefault();
          if (typeof window !== "undefined")
            window.dispatchEvent(new CustomEvent("lp:catch"));
        }}
        onDragStart={(e) => {
          e.preventDefault();
          if (typeof window !== "undefined")
            window.dispatchEvent(new CustomEvent("lp:catch"));
        }}
        data-cursor
        className="group block"
      >
        <motion.div
          animate={{ x: pos.x, y: pos.y }}
          transition={{ type: "spring", stiffness: 130, damping: 22 }}
          className="sticker relative w-full overflow-hidden rounded-[var(--radius-card)] bg-[color:var(--color-parchment-deep)]/40"
          style={{ aspectRatio: `${project.cover.w} / ${project.cover.h}` }}
        >
          <Image
            src={project.cover.src}
            alt={project.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            priority={priority}
            quality={88}
            className="object-cover transition-transform duration-[1300ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
          />
        </motion.div>

        <div className="mt-4 flex items-baseline justify-between gap-4 px-1">
          <p className="font-display text-xl tracking-[-0.01em] md:text-2xl">
            <span className="hand-underline italic">
              {project.title}
            </span>
          </p>
          <span
            aria-hidden
            className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-mute)] transition-colors duration-500 group-hover:text-[color:var(--accent)]"
          >
            {CATEGORY_LABELS[project.category]}
            {project.year ? <> · {project.year}</> : null}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
