"use client";

import type { VideoMeta } from "@content/projects";

/**
 * Inline video. Fills its parent — the parent must have an explicit
 * aspect-ratio (set by DocumentationGrid based on the video's real
 * dimensions). For self-hosted .mp4/.mov, renders a native <video>.
 * For Vimeo/YouTube URLs (when `_meta.txt` has `video: <url>`), an
 * iframe embed.
 */
export default function ProjectVideo({ video }: { video: VideoMeta }) {
  if (video.embed) {
    const embedUrl = toEmbedUrl(video.src);
    return (
      <div className="sticker relative h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-black">
        <iframe
          src={embedUrl}
          title={video.label}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="sticker relative h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-black">
      <video
        src={video.src}
        autoPlay
        muted
        loop
        playsInline
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
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
