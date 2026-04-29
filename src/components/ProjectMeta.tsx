import type { Project } from "@content/projects";

/**
 * Editorial details strip — sits below the lead image on a project page.
 * Only shows fields that actually exist in the metadata. No fabrication;
 * no class codes, instructor names, or contact info ever displayed.
 */
export default function ProjectMeta({ project }: { project: Project }) {
  const rows: { label: string; value: string }[] = [];
  if (project.medium) rows.push({ label: "Medium", value: project.medium });
  if (project.size) rows.push({ label: "Size", value: project.size });
  if (project.date) rows.push({ label: "Date", value: project.date });

  if (rows.length === 0) return null;

  return (
    <section className="container-edge mx-auto max-w-[1400px] py-10 md:py-14">
      <dl className="grid grid-cols-1 gap-x-12 gap-y-6 border-t border-[var(--rule)] pt-8 sm:grid-cols-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex flex-col">
            <dt className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--fg-mute)]">
              {label}
            </dt>
            <dd className="mt-2 lp-italic text-2xl tracking-[-0.01em] md:text-3xl">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
