"use client";

import { type ReactNode } from "react";

/**
 * Generic justified-row layout (Flickr / Google Photos pattern).
 *
 *   Each row's items get `flex-grow` proportional to their aspect
 *   ratio with `flex-basis: 0`. Combined with `aspect-ratio: w/h` on
 *   each item, every item in a row ends up the same height.
 *
 *   Math:
 *     given items i with aspect a_i = w_i / h_i,
 *     each item's flex grow is a_i and flex basis is 0,
 *     so width_i = (a_i / Σa) × rowWidth
 *     and height_i = width_i / a_i = rowWidth / Σa  (same for all)
 *
 * Row grouping (caps to 3 per row, last-row balanced):
 *   1 → [1]
 *   2 → [2]
 *   3 → [3]
 *   4 → [2,2]
 *   5 → [3,2]
 *   6 → [3,3]
 *   7 → [3,2,2]   (avoids orphan singleton)
 *   8 → [3,3,2]
 *   N → rows of 3, with last row rebalanced if it would orphan a single
 *
 * On mobile (`< sm`), every row collapses to a vertical stack.
 */

export type JustifiedItem = {
  /** Anything providing aspect — width/height in any consistent unit */
  w: number;
  h: number;
};

function rowGroupsFor<T>(items: T[]): T[][] {
  const n = items.length;
  if (n === 0) return [];
  if (n <= 3) return [items];
  if (n === 4) return [items.slice(0, 2), items.slice(2, 4)];

  const rows: T[][] = [];
  let i = 0;
  while (i < n) {
    const remaining = n - i;
    if (remaining === 4) {
      rows.push(items.slice(i, i + 2));
      rows.push(items.slice(i + 2, i + 4));
      i += 4;
    } else if (remaining === 1 && rows.length > 0) {
      const prev = rows.pop()!;
      rows.push(prev.slice(0, prev.length - 1));
      rows.push([prev[prev.length - 1], items[i]]);
      i += 1;
    } else if (remaining <= 3) {
      rows.push(items.slice(i, n));
      i = n;
    } else {
      rows.push(items.slice(i, i + 3));
      i += 3;
    }
  }
  return rows;
}

export default function JustifiedRows<T extends JustifiedItem>({
  items,
  render,
  /** flex item alignment within a row — `start` lets captions hang naturally */
  align = "start",
  className,
}: {
  items: T[];
  render: (item: T, indexInItems: number) => ReactNode;
  align?: "start" | "stretch";
  className?: string;
}) {
  if (items.length === 0) return null;
  const rows = rowGroupsFor(items);

  // We need a stable index back into the original items array so
  // callers can pass it to LightboxImage etc. Build a position map.
  const indexOf = new Map<T, number>();
  items.forEach((it, i) => indexOf.set(it, i));

  const alignClass = align === "stretch" ? "sm:items-stretch" : "sm:items-start";

  return (
    <div className={`flex flex-col gap-6 ${className ?? ""}`}>
      {rows.map((row, ri) => (
        <div
          key={ri}
          className={`flex flex-col gap-6 sm:flex-row ${alignClass}`}
        >
          {row.map((item, i) => (
            <div
              key={i}
              style={{ flex: `${item.w / item.h} 1 0%` }}
              className="min-w-0"
            >
              {render(item, indexOf.get(item) ?? 0)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
