"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

/**
 * Image viewer with two simple gestures:
 *
 *   Wheel  →  zoom (1× to 3×)
 *   Mouse  →  pan (only while zoomed)
 *
 * No drag-to-swipe, no pinch heuristics — predictable. The custom
 * cursor switches into a "zoom-in" state at 1× and a "pan" state
 * once you're zoomed in. ← / → / Esc handle nav and close.
 */

export type LightboxImage = {
  src: string;
  w: number;
  h: number;
  alt?: string;
};

type LightboxState = { gallery: LightboxImage[]; index: number };

type Ctx = {
  open: (gallery: LightboxImage[], index?: number) => void;
};

const LightboxContext = createContext<Ctx | null>(null);

export function useLightbox(): Ctx {
  const ctx = useContext(LightboxContext);
  if (!ctx) return { open: () => {} };
  return ctx;
}

export default function LightboxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LightboxState | null>(null);

  const open = useCallback((gallery: LightboxImage[], index = 0) => {
    setState({ gallery, index });
  }, []);
  const close = useCallback(() => setState(null), []);

  const nav = useCallback((dir: -1 | 1) => {
    setState((s) => {
      if (!s) return s;
      const len = s.gallery.length;
      return { ...s, index: (s.index + dir + len) % len };
    });
  }, []);

  // Keyboard
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") nav(-1);
      else if (e.key === "ArrowRight") nav(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close, nav]);

  // Body scroll lock
  useEffect(() => {
    if (!state) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [state]);

  // Reset cursor mode when lightbox closes
  useEffect(() => {
    if (!state) {
      window.dispatchEvent(new CustomEvent("lp:cursor-mode", { detail: { mode: null } }));
    }
  }, [state]);

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {state && (
          <LightboxView
            key="lb"
            gallery={state.gallery}
            index={state.index}
            onClose={close}
            onNav={nav}
          />
        )}
      </AnimatePresence>
    </LightboxContext.Provider>
  );
}

/* ────────────────────────────────────────────────────────────── */

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.18; // per wheel tick

function LightboxView({
  gallery,
  index,
  onClose,
  onNav,
}: {
  gallery: LightboxImage[];
  index: number;
  onClose: () => void;
  onNav: (dir: -1 | 1) => void;
}) {
  const img = gallery[index];
  const multi = gallery.length > 1;

  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Reset zoom + pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [img.src]);

  // Cursor mode dispatch — keep external cursor in sync with state
  useEffect(() => {
    const mode = zoom > 1.001 ? "pan" : "zoom-in";
    window.dispatchEvent(new CustomEvent("lp:cursor-mode", { detail: { mode } }));
  }, [zoom]);

  // Wheel → zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    setZoom((z) => {
      const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + dir * ZOOM_STEP));
      // Snap pan back to center as we zoom out to 1×
      if (next === ZOOM_MIN) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Mouse-move → pan (only when zoomed in)
  const onMouseMove = (e: React.MouseEvent) => {
    const stage = stageRef.current;
    if (!stage || zoom <= 1.001) return;
    const r = stage.getBoundingClientRect();
    // Normalize cursor 0..1 inside the stage
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    // Pan range as % of image — extra "headroom" beyond visible at zoom z is (z-1)/2 on each side.
    const range = (zoom - 1) * 50; // percent
    setPan({
      x: -(nx - 0.5) * 2 * range,
      y: -(ny - 0.5) * 2 * range,
    });
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[200] bg-black/92 backdrop-blur-2xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top bar — counter + close */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5 md:p-7">
        <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/60">
          {String(index + 1).padStart(2, "0")} <span className="opacity-50">/</span>{" "}
          {String(gallery.length).padStart(2, "0")}
          {zoom > 1.001 && (
            <>
              <span className="opacity-50"> · </span>
              <span>{zoom.toFixed(1)}×</span>
            </>
          )}
        </span>
        <button
          type="button"
          aria-label="Close viewer"
          onClick={onClose}
          data-cursor
          className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/60 hover:text-white md:h-10 md:w-10"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M1 1 L 13 13 M13 1 L 1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Image stage */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          ref={stageRef}
          key={img.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          onWheel={onWheel}
          onMouseMove={onMouseMove}
          className="absolute inset-0 flex items-center justify-center overflow-hidden px-5 py-16 md:px-20 md:py-20"
          style={{ touchAction: "none" }}
        >
          <motion.div
            animate={{ scale: zoom, x: `${pan.x}%`, y: `${pan.y}%` }}
            transition={{ type: "spring", stiffness: 280, damping: 32, mass: 0.5 }}
            className="flex max-h-full max-w-full items-center justify-center will-change-transform"
            style={{ pointerEvents: "none" }}
          >
            <Image
              src={img.src}
              alt={img.alt ?? ""}
              width={img.w}
              height={img.h}
              quality={95}
              priority
              sizes="100vw"
              draggable={false}
              onContextMenu={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("lp:catch"));
              }}
              onDragStart={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("lp:catch"));
              }}
              className="max-h-[calc(100vh-9rem)] max-w-[calc(100vw-3rem)] select-none object-contain md:max-h-[calc(100vh-10rem)] md:max-w-[calc(100vw-12rem)]"
              style={{ userSelect: "none", WebkitUserSelect: "none", WebkitUserDrag: "none" } as React.CSSProperties}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows — only when there's more than one */}
      {multi && (
        <>
          <NavButton side="left" onClick={() => onNav(-1)} />
          <NavButton side="right" onClick={() => onNav(1)} />
        </>
      )}

      {/* Hint — always present, contextual to zoom state */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 hidden text-center text-[10px] uppercase tracking-[0.32em] text-white/40 md:block">
        {zoom > 1.001
          ? "Move mouse to pan · scroll to zoom · esc to close"
          : multi
          ? "Scroll to zoom · ← → to navigate · esc to close"
          : "Scroll to zoom · esc to close"}
      </div>
    </motion.div>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const isLeft = side === "left";
  return (
    <button
      type="button"
      aria-label={isLeft ? "Previous image" : "Next image"}
      onClick={onClick}
      data-cursor
      className={`absolute top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white/80 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/60 hover:text-white md:h-12 md:w-12 ${
        isLeft ? "left-3 md:left-6" : "right-3 md:right-6"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        {isLeft ? (
          <path d="M9 1 L 3 7 L 9 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M5 1 L 11 7 L 5 13" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
