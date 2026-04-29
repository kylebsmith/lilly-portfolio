import Link from "next/link";
import Hero from "@/components/Hero";
import DisciplineRibbon from "@/components/DisciplineRibbon";
import Masonry from "@/components/Masonry";
import Reveal from "@/components/Reveal";
import { Doodle } from "@/components/Doodles";
import { featuredProjects } from "@content/projects";
import { site } from "@content/site";

export default function Home() {
  const featured = featuredProjects(site.homeFavorites);

  return (
    <>
      <Hero />

      <DisciplineRibbon />

      {/* hand-drawn squiggle break — they liked this */}
      <div className="container-edge mx-auto max-w-[1100px] pt-4 md:pt-6">
        <Reveal y={12}>
          <Doodle.Wave
            aria-hidden
            className="h-3 w-full text-[color:var(--accent)] opacity-70"
          />
        </Reveal>
      </div>

      <section className="container-edge relative mx-auto max-w-[1700px] py-16 md:py-24">
        <Reveal>
          <div className="mb-14 flex items-end justify-between gap-6 md:mb-20">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[color:var(--fg-mute)]">
                Selected work
              </p>
              <h2 className="text-5xl tracking-[-0.025em] md:text-7xl">
                <span className="lp-italic">a few</span>{" "}
                <span className="relative inline-block">
                  <span className="highlight">favorites</span>
                </span>
                .
              </h2>
            </div>
            <Link
              href="/work"
              data-cursor
              className="group hidden whitespace-nowrap text-xs uppercase tracking-[0.22em] md:inline-flex md:items-center md:gap-2"
            >
              <span className="bg-[linear-gradient(var(--accent),var(--accent))] bg-[length:100%_1px] bg-[position:0_100%] bg-no-repeat pb-0.5">
                See all work
              </span>
              <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </Reveal>

        <Masonry projects={featured} />
      </section>

      {/* tiny personality strip — italic note in the margin */}
      <section className="container-edge mx-auto max-w-[1400px] py-16 md:py-24">
        <Reveal>
          <div className="grid gap-8 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-1">
              <Doodle.Star
                aria-hidden
                className="h-7 w-7 text-[color:var(--accent)] md:mt-3"
                style={{ transform: "rotate(-12deg)" }}
              />
            </div>
            <p className="lp-italic text-3xl leading-[1.15] tracking-[-0.01em] md:col-span-11 md:text-5xl">
              cards, covers, creatures —{" "}
              <span className="not-italic">
                <span className="highlight">all welcome</span>.
              </span>
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
