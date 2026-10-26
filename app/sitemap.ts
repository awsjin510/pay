import type { MetadataRoute } from "next";
import { companies, meta, roles, SITE_URL, TRACK_IDS } from "@/lib/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = meta.generatedAt;
  const page = (path: string, priority: number) => ({ url: `${SITE_URL}${path}`, lastModified, priority });
  return [
    page("/", 1),
    page("/sectors/cloud-security/", 0.9),
    page("/sectors/it-services/", 0.9),
    page("/compare/", 0.8),
    page("/nicknames/", 0.7),
    page("/roles/", 0.7),
    page("/submit/", 0.6),
    page("/about/", 0.5),
    ...TRACK_IDS.map((t) => page(`/industries/${t}/`, 0.9)),
    ...roles.filter((r) => r.stats).map((r) => page(`/roles/${r.id}/`, 0.6)),
    // Same rule as the page's robots meta: thin pages stay out of the index.
    ...companies.filter((c) => c.n >= meta.minN || c.official).map((c) => page(`/companies/${c.slug}/`, c.stats ? 0.8 : 0.4)),
  ];
}
