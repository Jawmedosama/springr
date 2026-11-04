import { regionFromPlace } from "../belgium";
import type { ContractType, Offer } from "../types";

/**
 * Agrégateurs qui demandent une clé gratuite. Sans clé, ils ne font rien.
 * Non testés en conditions réelles tant que les clés ne sont pas configurées.
 */
function guess(text: string): ContractType {
  const t = text.toLowerCase();
  if (/(étudiant|etudiant|student)/.test(t)) return "etudiant";
  if (/\b(stage|stagiair\w*)\b/.test(t)) return "stage";
  if (/\b(cdd|tijdelijk)\b/.test(t)) return "cdd";
  if (/\b(cdi|vast contract)\b/.test(t)) return "cdi";
  return "nc";
}

const clean = (s = "") => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();

interface JoobleJob {
  id: number | string;
  title?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  link?: string;
  company?: string;
  updated?: string;
}

/** Clé gratuite sur https://jooble.org/api/about */
export async function fetchJooble(what = "", where = "", km = 30): Promise<Offer[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];
  const res = await fetch(`https://be.jooble.org/api/${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keywords: what, location: where || "Belgique", radius: String(km) }),
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = (await res.json().catch(() => null)) as { jobs?: JoobleJob[] } | null;
  return (data?.jobs ?? []).map((j) => ({
    id: `jooble-${j.id}`,
    title: clean(j.title),
    company: j.company ?? "",
    city: j.location ?? "",
    region: regionFromPlace(j.location ?? ""),
    contract: guess(`${j.title} ${j.snippet}`),
    description: clean(j.snippet),
    url: j.link ?? "",
    source: "Jooble",
    publishedAt: j.updated ?? new Date().toISOString(),
    salary: j.salary || undefined,
  }));
}

interface CareerjetJob {
  url?: string;
  title?: string;
  company?: string;
  locations?: string;
  description?: string;
  date?: string;
  salary?: string;
}

/** Identifiant partenaire gratuit sur https://www.careerjet.be/partners/ */
export async function fetchCareerjet(what = "", where = ""): Promise<Offer[]> {
  const affid = process.env.CAREERJET_AFFID;
  if (!affid) return [];
  const params = new URLSearchParams({
    locale_code: "fr_BE",
    keywords: what,
    location: where,
    affid,
    pagesize: "50",
    user_ip: "127.0.0.1",
    user_agent: "Springr",
    url: "https://springr-two.vercel.app",
  });
  const res = await fetch(`https://public.api.careerjet.net/search?${params}`, { next: { revalidate: 3600 } }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = (await res.json().catch(() => null)) as { jobs?: CareerjetJob[] } | null;
  return (data?.jobs ?? []).map((j) => ({
    id: `careerjet-${j.url}`,
    title: clean(j.title),
    company: j.company ?? "",
    city: j.locations ?? "",
    region: regionFromPlace(j.locations ?? ""),
    contract: guess(`${j.title} ${j.description}`),
    description: clean(j.description),
    url: j.url ?? "",
    source: "Careerjet",
    publishedAt: j.date ? new Date(j.date).toISOString() : new Date().toISOString(),
    salary: j.salary || undefined,
  }));
}
