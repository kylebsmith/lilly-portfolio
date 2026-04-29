import type { Metadata } from "next";
import { projects } from "@content/projects";
import WorkGrid from "@/components/WorkGrid";
import Reveal from "@/components/Reveal";
import { Doodle } from "@/components/Doodles";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected work by Lilly Patterson — illustration, visual development, character design, environments, editorial.",
};

export default function WorkIndex() {
  return (
    <section className="container-edge relative mx-auto max-w-[1700px] pb-24 pt-28 md:pb-32 md:pt-36">
      <Reveal>
        <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[color:var(--fg-mute)]">
          Index
        </p>
        <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.025em]">
          <span className="lp-italic">the</span>{" "}
          <span className="relative inline-block whitespace-nowrap">
            archive
            <Doodle.Underline
              aria-hidden
              className="pointer-events-none absolute -bottom-2 left-0 h-2.5 w-full text-[color:var(--accent)]"
            />
          </span>
          .
        </h1>
        <p className="mt-6 max-w-[42ch] text-base text-[color:var(--fg-mute)] md:text-lg">
          Filter by what you came for, or scroll all of it.
        </p>
      </Reveal>

      <div className="mt-16 md:mt-20">
        <WorkGrid projects={projects} />
      </div>
    </section>
  );
}
