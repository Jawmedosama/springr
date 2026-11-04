import { regionFromPlace } from "../belgium";
import type { ContractType, Offer, Region } from "../types";

/**
 * Pages carrières publiques, lues par les API prévues pour ça (Greenhouse, Lever, Recruitee, SmartRecruiters).
 * Pour ajouter une entreprise : vérifier qu'elle publie des offres en Belgique, puis l'ajouter ici.
 */
const BOARDS: { ats: "greenhouse" | "lever" | "recruitee" | "smartrecruiters"; slug: string; name: string }[] = [
  { ats: "smartrecruiters", slug: "Securitas", name: "Securitas" },
  { ats: "smartrecruiters", slug: "Primark", name: "Primark" },
  { ats: "recruitee", slug: "lansweeper", name: "Lansweeper" },
  { ats: "recruitee", slug: "bizzy", name: "Bizzy" },
  { ats: "greenhouse", slug: "showpad", name: "Showpad" },
  { ats: "greenhouse", slug: "collibra", name: "Collibra" },
  { ats: "greenhouse", slug: "lighthouse", name: "Lighthouse" },
  { ats: "greenhouse", slug: "deliveroo", name: "Deliveroo" },
  { ats: "greenhouse", slug: "sumup", name: "SumUp" },
  { ats: "greenhouse", slug: "adyen", name: "Adyen" },
  { ats: "greenhouse", slug: "stripe", name: "Stripe" },
  { ats: "greenhouse", slug: "airbnb", name: "Airbnb" },
  { ats: "lever", slug: "kpler", name: "Kpler" },
];

const IN_BELGIUM = /belgi|belgique|belgië/i;

interface Raw {
  id: string;
  title: string;
  place: string;
  url: string;
  publishedAt?: string;
  commitment?: string;
  /** La source a déjà filtré sur la Belgique. */
  belgian?: boolean;
}

async function get<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { next: { revalidate: 21600 } }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json().catch(() => null)) as T | null;
}

async function greenhouse(slug: string): Promise<Raw[]> {
  const d = await get<{ jobs?: { id: number; title: string; absolute_url: string; updated_at?: string; location?: { name?: string } }[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
  );
  return (d?.jobs ?? []).map((j) => ({ id: String(j.id), title: j.title, place: j.location?.name ?? "", url: j.absolute_url, publishedAt: j.updated_at }));
}

async function lever(slug: string): Promise<Raw[]> {
  const d = await get<{ id: string; text: string; hostedUrl: string; createdAt?: number; country?: string; categories?: { location?: string; commitment?: string } }[]>(
    `https://api.lever.co/v0/postings/${slug}?mode=json`,
  );
  return (Array.isArray(d) ? d : []).map((j) => ({
    id: j.id,
    title: j.text,
    place: `${j.categories?.location ?? ""}, ${j.country === "BE" ? "Belgium" : ""}`,
    url: j.hostedUrl,
    publishedAt: j.createdAt ? new Date(j.createdAt).toISOString() : undefined,
    commitment: j.categories?.commitment,
  }));
}

async function recruitee(slug: string): Promise<Raw[]> {
  const d = await get<{ offers?: { id: number; title: string; careers_url: string; published_at?: string; city?: string; country?: string; location?: string }[] }>(
    `https://${slug}.recruitee.com/api/offers/`,
  );
  return (d?.offers ?? []).map((j) => ({
    id: String(j.id),
    title: j.title,
    place: `${j.city || j.location || ""}, ${j.country ?? ""}`,
    url: j.careers_url,
    publishedAt: j.published_at,
  }));
}

async function smartrecruiters(slug: string): Promise<Raw[]> {
  const d = await get<{ content?: { id: string; name: string; releasedDate?: string; location?: { city?: string }; typeOfEmployment?: { label?: string } }[] }>(
    `https://api.smartrecruiters.com/v1/companies/${slug}/postings?country=be&limit=100`,
  );
  return (d?.content ?? []).map((j) => ({
    id: j.id,
    title: j.name,
    place: j.location?.city ?? "",
    url: `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
    publishedAt: j.releasedDate,
    commitment: j.typeOfEmployment?.label,
    belgian: true,
  }));
}

const READERS = { greenhouse, lever, recruitee, smartrecruiters };

function contract(r: Raw): ContractType {
  const t = `${r.title} ${r.commitment ?? ""}`.toLowerCase();
  if (/\bflexi[- ]?job/.test(t)) return "flexi";
  if (/\b(student|étudiant|etudiant|jobiste)/.test(t)) return "etudiant";
  if (/\b(stage|stagiair\w*|intern|internship)\b/.test(t)) return "stage";
  if (/\b(temporary|fixed[- ]term|cdd|tijdelijk)\b/.test(t)) return "cdd";
  if (/\b(permanent|cdi|vast)\b/.test(t)) return "cdi";
  return "nc";
}

export interface CareersQuery {
  what?: string;
  where?: string;
  region?: Region;
}

export async function fetchCareers(q: CareersQuery = {}): Promise<Offer[]> {
  const words = (q.what ?? "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const region = q.region ?? (q.where ? regionFromPlace(q.where) : undefined);
  const lists = await Promise.all(
    BOARDS.map(async (b) => {
      const jobs = await READERS[b.ats](b.slug).catch(() => [] as Raw[]);
      return jobs
        .filter((j) => j.belgian || IN_BELGIUM.test(j.place) || regionFromPlace(j.place))
        .map((j): Offer => ({
          id: `${b.ats}-${b.slug}-${j.id}`,
          title: j.title,
          company: b.name,
          city: j.place.split(",")[0].trim() || "Belgique",
          region: regionFromPlace(j.place),
          contract: contract(j),
          description: `Offre publiée sur la page carrières de ${b.name}.`,
          url: j.url,
          source: "Page carrières",
          publishedAt: j.publishedAt ?? new Date().toISOString(),
        }));
    }),
  );
  return lists
    .flat()
    .filter((o) => !words.length || words.some((w) => o.title.toLowerCase().includes(w)))
    .filter((o) => !region || !o.region || o.region === region);
}
