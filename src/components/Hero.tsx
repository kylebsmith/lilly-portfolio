"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { heroProject } from "@content/projects";

/**
 * Full-bleed hero. Sits at ~82svh on a laptop so the marquee + first
 * row of work peek below the fold and invite the scroll.
 */
export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imgY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["0%", "14%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1.02, 1.12]);
  const titleY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -90]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.4, 0]);

  const project = heroProject();
  if (!project) return null;

  const easing = [0.22, 1, 0.36, 1] as const;

  return (
    <section
      ref={ref}
      className="relative -mt-px h-[82svh] w-full overflow-hidden"
    >
      <motion.div
        style={{ y: imgY, scale: imgScale }}
        className="absolute inset-0 will-change-transform"
      >
        <Image
          src={project.cover.src}
          alt={project.title}
          fill
          priority
          sizes="100vw"
          quality={92}
          className="object-cover"
        />
      </motion.div>

      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(140% 80% at 18% 100%, rgba(8,5,2,0.62) 0%, rgba(8,5,2,0) 55%),
            linear-gradient(180deg, rgba(8,5,2,0.18) 0%, rgba(8,5,2,0) 22%, rgba(8,5,2,0) 60%, rgba(8,5,2,0.55) 100%)
          `,
        }}
      />

      <motion.div
        style={{ y: titleY, opacity: titleOpacity }}
        className="container-edge absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[1700px] pb-14 md:pb-20"
      >
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: easing }}
          className="mb-3 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-[#f5e9c8]/85"
        >
          <span aria-hidden className="inline-block h-px w-8 bg-[#f5e9c8]/85" />
          Portfolio · {new Date().getFullYear()}
        </motion.p>

        <h1 className="text-[clamp(3rem,9vw,8.5rem)] leading-[0.95] tracking-[-0.025em] text-[#fbf3dc] [text-shadow:_0_2px_30px_rgba(0,0,0,0.35)]">
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: easing }}
            className="block lp-italic"
          >
            a lil&apos; bit
          </motion.span>
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: easing }}
            className="block pl-[8vw] lp-italic text-[color:var(--accent-glow)]"
          >
            of fun.
          </motion.span>
        </h1>

        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.45 }}
          className="mt-7 flex flex-wrap items-end justify-between gap-5"
        >
          <p className="max-w-[40ch] text-sm leading-relaxed text-[#f5e9c8]/90 md:text-base">
            Illustration · Visual Development.{" "}
            <span className="opacity-80">Atlanta, MFA at SCAD.</span>
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary — solid gold, dark ink text */}
            <Link
              href="/work"
              data-cursor
              className="group inline-flex min-h-[44px] items-center gap-2.5 rounded-full bg-[color:var(--accent)] px-7 py-3.5 text-xs uppercase tracking-[0.22em] text-[#1a1208] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:-translate-y-0.5"
            >
              See the work
              <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </Link>
            {/* Secondary — solid cream, dark ink text. Stays legible on any artwork. */}
            <Link
              href={`/work/${project.slug}`}
              data-cursor
              className="inline-flex min-h-[44px] items-center rounded-full bg-[#fbf3dc] px-7 py-3.5 text-xs uppercase tracking-[0.22em] text-[#1a1208] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:-translate-y-0.5 hover:bg-white"
            >
              View hero piece
            </Link>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.1 }}
        className="absolute bottom-5 right-5 hidden items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#f5e9c8]/70 md:flex"
      >
        <span>Scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
          className="inline-block h-5 w-px bg-current"
        />
      </motion.div>
    </section>
  );
}
