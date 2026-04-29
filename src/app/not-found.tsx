import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-edge mx-auto grid min-h-[80svh] max-w-[1100px] place-items-center pt-40 text-center">
      <div>
        <p className="mb-6 text-xs uppercase tracking-[0.32em] text-[color:var(--fg-mute)]">
          404
        </p>
        <h1 className="text-[clamp(3rem,8vw,7rem)] leading-[0.95] tracking-[-0.025em]">
          Off the path.
        </h1>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            data-cursor
            className="rounded-full bg-[color:var(--accent)] px-7 py-3.5 text-xs uppercase tracking-[0.22em] text-[#1a1208]"
          >
            Home
          </Link>
          <Link
            href="/work"
            data-cursor
            className="rounded-full border border-[var(--fg)]/40 px-7 py-3.5 text-xs uppercase tracking-[0.22em] hover:border-[var(--fg)]/70"
          >
            All work
          </Link>
        </div>
      </div>
    </section>
  );
}
