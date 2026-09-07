import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  adjacentProjects,
  CATEGORY_LABELS,
  projectBySlug,
  projects,
} from "@content/projects";
import Reveal from "@/components/Reveal";
import { Doodle } from "@/components/Doodles";
import LightboxImage from "@/components/LightboxImage";
import type { LightboxImage as LbImage } from "@/components/Lightbox";
import ProjectMeta from "@/components/ProjectMeta";
import DocumentationGrid, {
  type DocItem,
} from "@/components/DocumentationGrid";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) return { title: "Not found" };
  return {
    title: project.title,
    description: project.blurb,
    openGraph: {
      title: project.title,
      description: project.blurb,
      images: [{ url: project.cover.src }],
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  const { prev, next } = adjacentProjects(slug);
  const lbGallery: LbImage[] = project.gallery.map((g) => ({
    src: g.src,
    w: g.w,
    h: g.h,
    alt: project.title,
  }));

  /* ─────────────────────────────────────────────────────────────────
   *  Gallery layout (sketchbook): no hero treatment — every image
   *  participates in one big masonry, including the cover.
   * ───────────────────────────────────────────────────────────────── */
  if (project.layout === "gallery") {
    const galleryItems: DocItem[] = project.gallery.map((g, i) => ({
      kind: "image" as const,
      src: g.src,
      w: g.w,
      h: g.h,
      lbIndex: i,
    }));
    project.videos.forEach((v) =>
      galleryItems.push({ kind: "video" as const, w: v.w, h: v.h, video: v })
    );

    return (
      <article>
        <header className="container-edge mx-auto max-w-[1700px] pb-10 pt-36 md:pb-14 md:pt-48">
          <Reveal>
            <Link
              href="/work"
              data-cursor
              className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)] hover:text-[color:var(--fg)]"
            >
              <span aria-hidden>←</span> All work
            </Link>
            <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[color:var(--fg-mute)]">
              {CATEGORY_LABELS[project.category]}
              {project.year ? <> · {project.year}</> : null}
            </p>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h1 className="text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.95] tracking-[-0.025em] text-balance">
                <span className="lp-italic">{project.title}</span>
              </h1>
              {project.blurb && (
                <p className="max-w-[40ch] text-base text-[color:var(--fg-mute)] md:text-lg">
                  {project.blurb}
                </p>
              )}
            </div>
          </Reveal>
        </header>

        <section className="container-edge mx-auto max-w-[1700px] pb-24 md:pb-32">
          <DocumentationGrid
            items={galleryItems}
            lbGallery={lbGallery}
            altTitle={project.title}
          />
        </section>

        <NextPrevNav prev={prev} next={next} />
      </article>
    );
  }

  /* ─────────────────────────────────────────────────────────────────
   *  Standard layout: hero image + meta strip + documentation grid
   * ───────────────────────────────────────────────────────────────── */

  // Build the documentation flow: gallery images (skipping cover) + videos.
  const restOfGallery = project.gallery.slice(1);
  const docItems: DocItem[] = [
    ...restOfGallery.map((g, i) => ({
      kind: "image" as const,
      src: g.src,
      w: g.w,
      h: g.h,
      lbIndex: i + 1, // +1 because lbGallery[0] is the cover
    })),
    ...project.videos.map((v) => ({ kind: "video" as const, w: v.w, h: v.h, video: v })),
  ];

  return (
    <article>
      <header className="container-edge mx-auto max-w-[1700px] pb-12 pt-36 md:pt-48">
        <Reveal>
          <Link
            href="/work"
            data-cursor
            className="mb-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)] hover:text-[color:var(--fg)]"
          >
            <span aria-hidden>←</span> All work
          </Link>
        </Reveal>

        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-8">
            <Reveal>
              <p className="mb-4 text-xs uppercase tracking-[0.32em] text-[color:var(--fg-mute)]">
                {CATEGORY_LABELS[project.category]}
                {project.year ? <> · {project.year}</> : null}
              </p>
              <h1 className="text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-balance">
                <span className="lp-italic">{project.title}</span>
              </h1>
            </Reveal>
          </div>
          {project.blurb && (
            <div className="md:col-span-4 md:pt-2">
              <Reveal delay={0.1}>
                <p className="text-lg leading-relaxed text-[color:var(--fg-mute)] md:text-xl">
                  {project.blurb}
                </p>
              </Reveal>
            </div>
          )}
        </div>
      </header>

      <Reveal y={48}>
        <div
          className="relative mx-auto w-full overflow-hidden bg-[color:var(--color-parchment-deep)]/40"
          style={{ aspectRatio: `${project.cover.w} / ${project.cover.h}` }}
        >
          <LightboxImage
            gallery={lbGallery}
            index={0}
            alt={project.title}
            fill
            priority
            quality={90}
            sizes="100vw"
          />
        </div>
      </Reveal>

      <Reveal y={20}>
        <ProjectMeta project={project} />
      </Reveal>

      {docItems.length > 0 && (
        <>
          <div className="container-edge mx-auto flex max-w-[1700px] items-center gap-4 py-10 text-xs uppercase tracking-[0.32em] text-[color:var(--fg-mute)]">
            <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
            <span>Documentation</span>
            <Doodle.Star aria-hidden className="h-3 w-3 text-[color:var(--accent)]" />
            <span aria-hidden className="h-px flex-1 bg-[var(--rule)]" />
          </div>

          <section className="container-edge mx-auto max-w-[1700px] pb-20 md:pb-28">
            <DocumentationGrid
              items={docItems}
              lbGallery={lbGallery}
              altTitle={project.title}
            />
          </section>
        </>
      )}

      <NextPrevNav prev={prev} next={next} />
    </article>
  );
}

function NextPrevNav({
  prev,
  next,
}: {
  prev: { slug: string; title: string };
  next: { slug: string; title: string };
}) {
  return (
    <nav className="container-edge mx-auto grid max-w-[1700px] gap-6 border-t border-[var(--rule)] py-16 md:grid-cols-2">
      <Link
        href={`/work/${prev.slug}`}
        data-cursor
        className="group flex flex-col items-start"
      >
        <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)]">
          ← Previous
        </span>
        <span className="mt-2 lp-italic text-2xl tracking-[-0.01em] transition-colors group-hover:text-[color:var(--accent)] md:text-4xl">
          {prev.title}
        </span>
      </Link>
      <Link
        href={`/work/${next.slug}`}
        data-cursor
        className="group flex flex-col items-start text-right md:items-end"
      >
        <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)]">
          Next →
        </span>
        <span className="mt-2 lp-italic text-2xl tracking-[-0.01em] transition-colors group-hover:text-[color:var(--accent)] md:text-4xl">
          {next.title}
        </span>
      </Link>
    </nav>
  );
}
