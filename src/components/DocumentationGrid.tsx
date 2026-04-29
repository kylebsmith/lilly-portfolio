"use client";

import LightboxImage from "./LightboxImage";
import ProjectVideo from "./ProjectVideo";
import JustifiedRows from "./JustifiedRows";
import type { LightboxImage as LbImage } from "./Lightbox";
import type { VideoMeta } from "@content/projects";

/**
 * Documentation strip on a project page. Mixes images and videos in a
 * single justified-row layout (see JustifiedRows for the math) — heights
 * match within a row, widths split proportionally to aspect.
 */

export type ImageDocItem = {
  kind: "image";
  src: string;
  w: number;
  h: number;
  /** index in the lightbox gallery so click opens at the right one */
  lbIndex: number;
};

export type VideoDocItem = {
  kind: "video";
  w: number;
  h: number;
  video: VideoMeta;
};

export type DocItem = ImageDocItem | VideoDocItem;

export default function DocumentationGrid({
  items,
  lbGallery,
  altTitle,
}: {
  items: DocItem[];
  lbGallery: LbImage[];
  altTitle: string;
}) {
  if (items.length === 0) return null;

  return (
    <JustifiedRows
      items={items}
      align="stretch"
      render={(item) => {
        if (item.kind === "image") {
          return (
            <figure
              className="sticker relative block h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-[color:var(--color-parchment-deep)]/40"
              style={{ aspectRatio: `${item.w} / ${item.h}` }}
            >
              <LightboxImage
                gallery={lbGallery}
                index={item.lbIndex}
                alt={altTitle}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                quality={88}
              />
            </figure>
          );
        }
        return (
          <div
            className="relative block h-full w-full"
            style={{ aspectRatio: `${item.w} / ${item.h}` }}
          >
            <ProjectVideo video={item.video} />
          </div>
        );
      }}
    />
  );
}
