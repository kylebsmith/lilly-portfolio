"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Three layers:
 *   • a precise dot (1:1 with cursor)
 *   • a lagging ring that grows on hoverable elements
 *   • a discreet sparkle trail behind fast cursor movement
 *
 * Listens for `lp:cursor-mode` events from the lightbox to swap the
 * ring's center indicator (zoom-in glyph at 1×, pan glyph when zoomed).
 *
 * Sits at z-[300] so it's always above the lightbox (z-[200]).
 * Touch + reduced-motion users opt out automatically.
 */

const TRAIL_POOL = 6;
const TRAIL_THRESHOLD_PX = 36;
const TRAIL_LIFE_MS = 750;

type CursorMode = null | "zoom-in" | "pan";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode>(null);

  // 1. Capability detection
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);
  }, []);

  // 1b. Tell the stylesheet the custom cursor is actually rendering.
  //
  // globals.css hides the native cursor, but ONLY under this flag. Without
  // it, a desktop visitor with "reduce motion" enabled got `cursor: none`
  // from the media query while this component bailed out above and drew
  // nothing — leaving them with no visible pointer at all.
  useEffect(() => {
    const root = document.documentElement;
    if (enabled) root.dataset.customCursor = "on";
    else delete root.dataset.customCursor;
    return () => { delete root.dataset.customCursor; };
  }, [enabled]);

  // 2. Listen for lightbox-driven cursor mode
  useEffect(() => {
    const onMode = (e: Event) => {
      const detail = (e as CustomEvent<{ mode: CursorMode }>).detail;
      setMode(detail?.mode ?? null);
    };
    window.addEventListener("lp:cursor-mode", onMode);
    return () => window.removeEventListener("lp:cursor-mode", onMode);
  }, []);

  // 3. Wire up the cursor itself (after enabled flips so refs exist)
  useEffect(() => {
    if (!enabled) return;
    const container = trailRef.current;
    if (!container) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: target.x, y: target.y, scale: 1 };
    const last = { x: target.x, y: target.y };

    const spans: HTMLSpanElement[] = [];
    for (let i = 0; i < TRAIL_POOL; i++) {
      const s = document.createElement("span");
      s.textContent = "✦";
      s.style.cssText =
        "position:fixed;left:0;top:0;pointer-events:none;color:var(--accent);font-size:9px;line-height:1;opacity:0;transform:translate3d(-50%,-50%,0) scale(1);will-change:transform,opacity";
      container.appendChild(s);
      spans.push(s);
    }
    let poolIdx = 0;

    const dropSparkle = (x: number, y: number) => {
      const s = spans[poolIdx];
      poolIdx = (poolIdx + 1) % TRAIL_POOL;
      const jx = (Math.random() - 0.5) * 6;
      const jy = (Math.random() - 0.5) * 6;
      s.style.left = `${x + jx}px`;
      s.style.top = `${y + jy}px`;
      s.animate(
        [
          { opacity: 0.5, transform: "translate3d(-50%, -50%, 0) scale(1)" },
          {
            opacity: 0,
            transform: `translate3d(-50%, calc(-50% + ${(Math.random() - 0.5) * 8}px), 0) scale(0.45)`,
          },
        ],
        { duration: TRAIL_LIFE_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
      );
    };

    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      const dx = target.x - last.x;
      const dy = target.y - last.y;
      if (Math.hypot(dx, dy) >= TRAIL_THRESHOLD_PX) {
        dropSparkle(target.x, target.y);
        last.x = target.x;
        last.y = target.y;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      }
    };

    const onOver = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const hover = el.closest("a, button, [data-cursor]");
      ring.scale = hover ? 1.8 : 1;
    };

    const tick = () => {
      ring.x += (target.x - ring.x) * 0.18;
      ring.y += (target.y - ring.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${ring.scale})`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      cancelAnimationFrame(raf);
      spans.forEach((s) => s.remove());
    };
  }, [enabled]);

  if (!enabled) return null;

  // Different visual when in lightbox mode
  const isZoomMode = mode === "zoom-in" || mode === "pan";

  return (
    <>
      <div
        ref={trailRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[290]"
      />
      <div
        ref={ringRef}
        aria-hidden
        className={
          isZoomMode
            ? // Zoom modes: bigger, sharper ring + center indicator. White, not mix-blend (so it pops on dark backdrop).
              "pointer-events-none fixed left-0 top-0 z-[300] flex h-10 w-10 items-center justify-center rounded-full border border-white/85 text-white/85"
            : // Default: small accent-color ring with mix-blend-difference
              "pointer-events-none fixed left-0 top-0 z-[300] h-6 w-6 rounded-full border border-[color:var(--accent)] mix-blend-difference"
        }
        style={{ transition: "transform 220ms var(--ease-out-quint)" }}
      >
        {mode === "zoom-in" && (
          <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden>
            <path d="M6.5 2 V 11 M2 6.5 H 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )}
        {mode === "pan" && (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            {/* 4-arrow pan glyph */}
            <path
              d="M7 1 L 9 3 H 8 V 6 H 11 V 5 L 13 7 L 11 9 V 8 H 8 V 11 H 9 L 7 13 L 5 11 H 6 V 8 H 3 V 9 L 1 7 L 3 5 V 6 H 6 V 3 H 5 L 7 1 Z"
              fill="currentColor"
              fillRule="evenodd"
            />
          </svg>
        )}
      </div>
      <div
        ref={dotRef}
        aria-hidden
        className={
          isZoomMode
            ? "pointer-events-none fixed left-0 top-0 z-[300] h-1 w-1 rounded-full bg-white opacity-0"
            : "pointer-events-none fixed left-0 top-0 z-[300] h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] mix-blend-difference"
        }
      />
    </>
  );
}
