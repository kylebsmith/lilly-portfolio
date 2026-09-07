"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoMeta } from "@content/projects";

/**
 * Inline video. Fills its parent — the parent must have an explicit
 * aspect-ratio (set by DocumentationGrid based on the video's real
 * dimensions). For self-hosted .mp4/.mov, renders a native <video>.
 * For Vimeo/YouTube URLs (when `_meta.txt` has `video: <url>`), an
 * iframe embed.
 *
 * BANDWIDTH: nothing is fetched until the player scrolls into view.
 *
 * This used to render `<video src autoPlay loop>` with no `preload`, so
 * every visitor to a project page downloaded the whole file whether they
 * ever scrolled to it or not — 40 MB on /work/environment-study alone.
 * At Vercel's 100 GB free tier that is roughly 2,500 pageviews. Now the
 * `src` is only attached once an IntersectionObserver reports the player
 * near the viewport, so a visitor who never scrolls that far pays nothing.
 */
export default function ProjectVideo({ video }: { video: VideoMeta }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No IntersectionObserver (very old browser) — just load it.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      // Start fetching a little before it's actually on screen so the
      // player is usually ready by the time she reaches it.
      { rootMargin: "300px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (video.embed) {
    const embedUrl = toEmbedUrl(video.src);
    return (
      <div
        ref={ref}
        className="sticker relative h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-black"
      >
        {inView && (
          <iframe
            src={embedUrl}
            title={video.label}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="sticker relative h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-black"
    >
      <video
        // Only attach the source once it's near the viewport.
        src={inView ? video.src : undefined}
        preload="none"
        autoPlay
        muted
        loop
        playsInline
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        aria-label={video.label}
        onContextMenu={(e) => {
          e.preventDefault();
          if (typeof window !== "undefined")
            window.dispatchEvent(new CustomEvent("lp:catch"));
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

function toEmbedUrl(url: string): string {
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const yt =
    url.match(/youtu\.be\/([\w-]+)/) ||
    url.match(/youtube\.com\/watch\?v=([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return url;
}
