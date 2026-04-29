import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { Doodle } from "@/components/Doodles";
import { site } from "@content/site";
import LightboxImage from "@/components/LightboxImage";
import type { LightboxImage as LbImage } from "@/components/Lightbox";

export const metadata: Metadata = {
  title: "About",
  description: site.description,
};

// Personal images on the About page — both clickable to open in the
// lightbox, navigable as a small two-image gallery.
const ABOUT_GALLERY: LbImage[] = [
  { src: "/about/portrait.png", w: 818, h: 1022, alt: "Lilly Patterson" },
  { src: "/about/burger-at-desk.jpg", w: 2160, h: 2880, alt: "Burger at desk — sketchbook study" },
];

export default function About() {
  return (
    <>
      <section className="container-edge relative mx-auto max-w-[1500px] pb-20 pt-36 md:pt-52">
        <div className="grid gap-14 md:grid-cols-12 md:gap-20">
          <div className="md:col-span-7">
            <Reveal>
              <p className="mb-4 text-xs uppercase tracking-[0.32em] text-[color:var(--fg-mute)]">
                About
              </p>
              <h1 className="text-[clamp(2.5rem,6.5vw,5rem)] leading-[0.95] tracking-[-0.025em] text-balance">
                <span className="lp-italic">hi,</span> I&apos;m{" "}
                <span className="relative inline-block">
                  Lilly
                  <Doodle.Underline
                    aria-hidden
                    className="pointer-events-none absolute -bottom-2 left-0 h-2.5 w-full text-[color:var(--accent)]"
                  />
                  <Doodle.Twinkle
                    aria-hidden
                    className="pointer-events-none absolute -right-7 -top-3 h-5 w-5 text-[color:var(--accent)]"
                  />
                </span>
                .
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-12 space-y-6 text-lg leading-relaxed md:text-xl">
                {site.about.bio.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <dl className="mt-12 grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 border-t border-[var(--rule)] pt-8 text-sm md:max-w-md">
                <dt className="text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)]">
                  Based in
                </dt>
                <dd>{site.about.location}</dd>

                <dt className="text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)]">
                  Studying
                </dt>
                <dd>{site.about.program}</dd>

                <dt className="text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)]">
                  Email
                </dt>
                <dd>
                  <a
                    href={`mailto:${site.email}`}
                    data-cursor
                    className="hand-underline italic"
                  >
                    {site.email}
                  </a>
                </dd>
              </dl>
            </Reveal>
          </div>

          <div className="md:col-span-5">
            <Reveal delay={0.15}>
              <div className="sticker tilt-r-soft relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-[color:var(--color-parchment-deep)]/60">
                <LightboxImage
                  gallery={ABOUT_GALLERY}
                  index={0}
                  alt="Lilly Patterson"
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  quality={92}
                />
              </div>
            </Reveal>

            {/* Burger study — clickable, opens in lightbox alongside the portrait */}
            <Reveal delay={0.3}>
              <figure
                className="sticker tilt-l-soft relative mx-auto mt-10 aspect-[3/4] w-[68%] overflow-hidden rounded-[var(--radius-card)] bg-[color:var(--color-parchment-deep)]/60"
              >
                <LightboxImage
                  gallery={ABOUT_GALLERY}
                  index={1}
                  alt="Burger at desk — sketchbook study"
                  fill
                  sizes="(min-width: 768px) 28vw, 70vw"
                  quality={88}
                />
              </figure>
              <p className="mt-3 text-center font-hand text-xl text-[color:var(--accent)]">
                ✦ a page from the desk.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="container-edge mx-auto max-w-[1400px] border-t border-[var(--rule)] py-20 text-center">
        <Reveal>
          <p className="lp-italic text-4xl leading-[1.05] md:text-6xl">
            open for commissions.
          </p>
          <Link
            href="/contact"
            data-cursor
            className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-[color:var(--accent)] px-7 py-3.5 text-xs uppercase tracking-[0.22em] text-[#1a1208] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)] transition-transform duration-500 hover:-translate-y-0.5"
          >
            Get in touch
            <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
