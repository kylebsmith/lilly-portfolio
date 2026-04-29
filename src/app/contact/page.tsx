import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { Doodle } from "@/components/Doodles";
import { site } from "@content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Lilly Patterson.",
};

export default function Contact() {
  return (
    <section className="container-edge mx-auto max-w-[1300px] pb-32 pt-36 md:pt-52">
      <Reveal>
        <p className="mb-4 text-xs uppercase tracking-[0.32em] text-[color:var(--fg-mute)]">
          Contact
        </p>
        <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.025em] text-balance">
          <span className="lp-italic">say</span>{" "}
          <span className="relative inline-block">
            hello
            <Doodle.Underline
              aria-hidden
              className="pointer-events-none absolute -bottom-1.5 left-0 h-2.5 w-full text-[color:var(--accent)]"
            />
            <Doodle.Twinkle
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-4 h-5 w-5 text-[color:var(--accent)]"
            />
          </span>
          .
        </h1>
      </Reveal>

      <Reveal delay={0.1}>
        <a
          href={`mailto:${site.email}`}
          data-cursor
          className="group mt-16 block break-all border-y border-[var(--rule)] py-10 font-display text-3xl tracking-[-0.01em] hover:text-[color:var(--accent)] md:text-5xl"
        >
          <span className="lp-italic">{site.email}</span>
          <span aria-hidden className="ml-3 inline-block transition-transform duration-500 group-hover:translate-x-2">→</span>
        </a>
      </Reveal>

      <Reveal delay={0.2}>
        <ul className="mt-12 grid gap-3 text-sm md:grid-cols-3 md:text-base">
          {site.social.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                data-cursor
                className="group flex items-baseline justify-between border-b border-[var(--rule)] pb-3 transition-colors hover:text-[color:var(--accent)]"
              >
                <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)] group-hover:text-[color:var(--accent)]">
                  {s.label}
                </span>
                <span aria-hidden>↗</span>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={0.3}>
        <p className="mt-20 font-display lp-italic text-2xl text-[color:var(--fg-mute)] md:text-3xl">
          ✦ {site.about.location}.
        </p>
      </Reveal>
    </section>
  );
}
