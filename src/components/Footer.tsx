import Link from "next/link";
import { site } from "@content/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 mt-24 border-t border-[var(--rule)] pb-24 md:pb-32">
      <div className="container-edge mx-auto grid max-w-[1700px] gap-14 py-20 md:grid-cols-12">
        <div className="md:col-span-6">
          <p className="lp-italic text-4xl leading-[1.05] tracking-[-0.01em] md:text-6xl">
            get in touch.
          </p>
          <a
            href={`mailto:${site.email}`}
            data-cursor
            className="group mt-6 inline-flex items-center gap-3 break-all font-display text-xl underline decoration-[color:var(--accent)] decoration-2 underline-offset-[6px] hover:opacity-70 md:text-2xl"
          >
            {site.email}
            <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
          </a>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)]">
            Elsewhere
          </h4>
          <ul className="mt-5 space-y-2">
            {site.social.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor
                  className="group inline-flex items-center gap-2 hover:text-[color:var(--accent)]"
                >
                  <span className="hand-underline">{s.label}</span>
                  <span aria-hidden className="opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h4 className="text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)]">
            Index
          </h4>
          <ul className="mt-5 space-y-2">
            {site.nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} data-cursor className="hover:text-[color:var(--accent)]">
                  <span className="hand-underline">{n.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container-edge mx-auto flex max-w-[1700px] items-center justify-between border-t border-[var(--rule)] py-6 text-xs uppercase tracking-[0.22em] text-[color:var(--fg-mute)]">
        <span>© {year} {site.name}</span>
        <span className="font-hand text-base normal-case tracking-normal text-[color:var(--accent)]">
          ✦ click anywhere
        </span>
        <span>{site.about.location}</span>
      </div>
    </footer>
  );
}
