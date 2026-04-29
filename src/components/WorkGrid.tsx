"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Masonry from "./Masonry";
import {
  CATEGORY_LABELS,
  VISIBLE_CATEGORIES,
  type Category,
  type Project,
} from "@content/projects";
import { cn } from "@/lib/cn";

type Filter = Category | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Everything" },
  ...VISIBLE_CATEGORIES.map((c) => ({ id: c, label: CATEGORY_LABELS[c] })),
];

export default function WorkGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<Filter>("all");

  const visible = useMemo(() => {
    if (active === "all") return projects;
    return projects.filter((p) => p.category === active);
  }, [projects, active]);

  // Hide chips for empty categories so we never show a tab leading to nothing.
  const chips = FILTERS.filter(
    (f) => f.id === "all" || projects.some((p) => p.category === f.id)
  );

  return (
    <>
      <div
        className="mb-10 flex flex-wrap items-center gap-2 md:mb-14"
        role="tablist"
        aria-label="Filter projects by category"
      >
        {chips.map((f) => {
          const isActive = active === f.id;
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={isActive}
              data-cursor
              onClick={() => setActive(f.id)}
              className={cn(
                "relative rounded-full border px-5 py-2 text-xs uppercase tracking-[0.22em] transition-colors duration-300",
                // Chips stay parchment + ink in both themes — solid hex (no /opacity)
                isActive
                  ? "border-[#b88a3e] bg-[#b88a3e] text-[#1a1208]"
                  : "border-[#dccfb3] bg-[#fbf3dc] text-[#5a4d3b] hover:border-[#b88a3e] hover:text-[#1a1208]"
              )}
            >
              {f.label}
            </button>
          );
        })}
        <span className="ml-auto text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)]">
          {visible.length} {visible.length === 1 ? "piece" : "pieces"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Masonry projects={visible} />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
