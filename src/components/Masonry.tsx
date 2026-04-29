"use client";

import { type Project } from "@content/projects";
import WorkTile from "./WorkTile";
import JustifiedRows from "./JustifiedRows";

/**
 * Project grid — one tile per project, arranged in justified rows so
 * widths within a row are proportional to each cover image's aspect
 * ratio. Tall covers stay narrow, wide covers earn more horizontal
 * space, and image heights match across each row. No more giant
 * vertical tiles dominating the layout.
 */
export default function Masonry({ projects }: { projects: Project[] }) {
  // Adapt projects to JustifiedItem shape (uses cover dimensions for aspect)
  const items = projects.map((p) => ({
    project: p,
    w: p.cover.w,
    h: p.cover.h,
  }));

  return (
    <JustifiedRows
      items={items}
      render={(item, i) => (
        <WorkTile project={item.project} index={i} priority={i < 3} />
      )}
    />
  );
}
