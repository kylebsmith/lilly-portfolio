import type { MetadataRoute } from "next";
import { site } from "@content/site";
import { projects } from "@content/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, priority: 1.0, changeFrequency: "monthly" },
    { url: `${site.url}/work`, lastModified: now, priority: 0.9, changeFrequency: "monthly" },
    { url: `${site.url}/about`, lastModified: now, priority: 0.7, changeFrequency: "yearly" },
    { url: `${site.url}/contact`, lastModified: now, priority: 0.7, changeFrequency: "yearly" },
    ...projects.map((p) => ({
      url: `${site.url}/work/${p.slug}`,
      lastModified: now,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
  ];
}
