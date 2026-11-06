import { regionFromPlace } from "../belgium";
import type { ContractType, Offer } from "../types";

/**
 * Agrégateurs qui demandent une clé gratuite. Sans clé, ils ne font rien.
 * Non testés en conditions réelles tant que les clés ne sont pas configurées.
 */
function guess(text: string): ContractType {
  const t = text.toLowerCase();
  if (/\bflexi[- ]?job/.test(t)) return "flexi";
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
export async function fetchJooble(what = "", where = "", km = 30, page = 1): Promise<Offer[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];
  const res = await fetch(`https://be.jooble.org/api/${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keywords: what, location: where || "Belgique", radius: String(km), page: String(page), ResultOnPage: "100" }),
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) {
    console.warn(`Jooble : réponse ${res?.status ?? "absente"}`);
    return [];
  }
  const data = (await res.json().catch(() => null)) as { jobs?: JoobleJob[] } | null;
  if (!data?.jobs?.length) console.warn("Jooble : aucune offre renvoyée");
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

/** Clé partenaire gratuite sur https://www.careerjet.be/partners/ */
export async function fetchCareerjet(what = "", where = "", page = 1): Promise<Offer[]> {
  const affid = process.env.CAREERJET_AFFID;
  if (!affid) return [];
  const params = new URLSearchParams({
    locale_code: "fr_BE",
    keywords: what,
    location: where,
    page: String(page),
    page_size: "99",
    user_ip: "1.1.1.1",
    user_agent: "Mozilla/5.0",
    url: "https://springr-two.vercel.app",
  });
  const res = await fetch(`https://search.api.careerjet.net/v4/query?${params}`, {
    headers: { authorization: `Basic ${Buffer.from(`${affid}:`).toString("base64")}` },
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) {
    console.warn(`Careerjet : réponse ${res?.status ?? "absente"}`);
    return [];
  }
  const data = (await res.json().catch(() => null)) as { jobs?: CareerjetJob[]; type?: string; error?: string } | null;
  if (!data?.jobs?.length) console.warn(`Careerjet : aucune offre (${data?.type ?? "?"} ${data?.error ?? ""})`);
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
