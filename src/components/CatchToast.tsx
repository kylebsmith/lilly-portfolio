"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@content/site";

/**
 * Pops up briefly when someone tries to right-click or drag-save an
 * image. Disarming, on-brand voice — points at the email instead of
 * lecturing. Auto-dismisses after 4.5s; clickable to dismiss earlier.
 *
 * Listens for the global `lp:catch` event dispatched by image elements
 * via onContextMenu / onDragStart handlers.
 */
export default function CatchToast() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismiss: number | undefined;
    const onCatch = () => {
      setOpen(true);
      window.clearTimeout(dismiss);
      dismiss = window.setTimeout(() => setOpen(false), 4500);
    };
    window.addEventListener("lp:catch", onCatch);
    return () => {
      window.removeEventListener("lp:catch", onCatch);
      window.clearTimeout(dismiss);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[400] -translate-x-1/2"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            data-cursor
            className="group flex items-center gap-3 rounded-full border border-[color:var(--accent)]/40 bg-[color:var(--bg)]/95 px-5 py-3 text-left shadow-[0_30px_60px_-25px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          >
            <span aria-hidden className="text-base text-[color:var(--accent)]">✦</span>
            <span className="flex flex-col">
              <span className="font-display text-sm leading-tight md:text-base">
                <span className="lp-italic">caught you </span>
                — please ask first.
              </span>
              <a
                href={`mailto:${site.email}`}
                className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-mute)] transition-colors hover:text-[color:var(--accent)]"
                onClick={(e) => e.stopPropagation()}
              >
                {site.email} →
              </a>
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
