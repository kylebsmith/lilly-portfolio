"use client";

import { useState } from "react";
import Image from "next/image";
import { useLightbox, type LightboxImage as LbImage } from "./Lightbox";
import { cn } from "@/lib/cn";

/**
 * Drop-in replacement for `<Image>` on a project page. Renders a button
 * that opens the lightbox at this image's index, with the full project
 * gallery available for navigation.
 *
 * Use `fill` for parent-sized containers (with aspectRatio), or pass
 * width/height-style for intrinsic-sized layouts.
 */
type Props = {
  gallery: LbImage[];
  /** which gallery item to open at */
  index: number;
  alt: string;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  className?: string;
  /** for non-fill rendering, pass intrinsic width/height to next/image */
  intrinsic?: boolean;
};

export default function LightboxImage({
  gallery,
  index,
  alt,
  fill,
  sizes,
  quality,
  priority,
  className,
  intrinsic,
}: Props) {
  // If Vercel's image optimizer refuses — a 402 once the free-tier
  // transformation quota is spent — <Image> renders NOTHING and the page
  // goes blank where the artwork should be. The originals are plain static
  // files under /work/, so falling back to unoptimized re-fetches the real
  // JPEG: heavier, but the painting is still there.
  const [rawFallback, setRawFallback] = useState(false);
  const { open } = useLightbox();
  const img = gallery[index];

  const fireCatch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lp:catch"));
    }
  };

  return (
    <button
      type="button"
      data-cursor
      aria-label={`Open ${alt} in viewer`}
      onClick={() => open(gallery, index)}
      onContextMenu={fireCatch}
      onDragStart={fireCatch}
      className={cn(
        "group relative cursor-zoom-in",
        fill ? "absolute inset-0 block h-full w-full" : "block w-full",
        className
      )}
    >
      {fill ? (
        <Image
          src={img.src}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          priority={priority}
          draggable={false}
          unoptimized={rawFallback}
          onError={() => setRawFallback(true)}
          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.015]"
        />
      ) : (
        <Image
          src={img.src}
          alt={alt}
          width={img.w}
          height={img.h}
          sizes={sizes}
          quality={quality}
          priority={priority}
          draggable={false}
          unoptimized={rawFallback}
          onError={() => setRawFallback(true)}
          className={cn(
            "h-auto w-full transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.015]",
            intrinsic && "object-contain"
          )}
        />
      )}

      {/* tiny zoom-in hint on hover, top-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white opacity-0 backdrop-blur-md transition-opacity duration-500 group-hover:opacity-100"
      >
        <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden>
          <path d="M2 2 L 10 10 M10 2 L 2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        View
      </span>
    </button>
  );
}
