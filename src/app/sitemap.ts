import type { MetadataRoute } from "next";
import { LEGAL_SLUGS } from "@/lib/legal";
import { SEO_CITIES, SEO_JOBS, SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: string[] = [];
  for (const lang of ["fr", "nl"]) {
    urls.push(`${SITE}/${lang}`, `${SITE}/${lang}/offres`, `${SITE}/${lang}/entreprises`, `${SITE}/${lang}/extension`);
    for (const g of ["job-etudiant", "flexi-job", "cv-belgique"]) urls.push(`${SITE}/${lang}/guides/${g}`);
    for (const p of LEGAL_SLUGS) urls.push(`${SITE}/${lang}/legal/${p}`);
    for (const j of SEO_JOBS) for (const c of SEO_CITIES) urls.push(`${SITE}/${lang}/jobs/${j.slug}/${c.slug}`);
  }
  return urls.map((url) => ({ url }));
}
