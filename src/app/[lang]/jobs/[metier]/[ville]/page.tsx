import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, isLang } from "@/lib/i18n";
import { SEO_CITIES, SEO_JOBS } from "@/lib/seo";
import { fetchForem } from "@/lib/sources/forem";
import type { Lang } from "@/lib/types";

export const revalidate = 86400;

type Params = { lang: string; metier: string; ville: string };

function find(p: Params) {
  const lang: Lang = isLang(p.lang) ? p.lang : "fr";
  const job = SEO_JOBS.find((j) => j.slug === p.metier);
  const city = SEO_CITIES.find((c) => c.slug === p.ville);
  return { lang, job, city };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, job, city } = find(await params);
  if (!job || !city) return {};
  const title = lang === "nl" ? `${job.nl} vacatures in ${city.nl}` : `Offres d'emploi ${job.fr} à ${city.fr}`;
  return { title: `${title} · ${getDict(lang).brand}`, description: title };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { lang, job, city } = find(await params);
  if (!job || !city) notFound();
  const t = getDict(lang);
  const offers = await fetchForem({ what: job.query, where: city.fr, km: 30, all: true });
  const shown = offers.slice(0, 20);
  const name = lang === "nl" ? job.nl : job.fr;
  const place = lang === "nl" ? city.nl : city.fr;
  return (
    <main className="page">
      <div className="page-head">
        <h1>{lang === "nl" ? `${name}: vacatures in ${place}` : `${name} : offres d'emploi à ${place}`}</h1>
        <p>{offers.length} {t.seo.count}</p>
      </div>
      <p><Link className="btn dark" href={`/${lang}/offres`}>{t.seo.cta}</Link></p>
      <ul className="company-offers">
        {shown.map((o) => (
          <li key={o.id}>
            <a href={o.url} target="_blank" rel="noreferrer"><b>{o.title}</b></a>
            <span className="muted">{o.company} · {o.city} · {t.contracts[o.contract]}</span>
          </li>
        ))}
      </ul>
      <p className="muted small" style={{ marginTop: 16 }}>{t.footer.sources}</p>
    </main>
  );
}
