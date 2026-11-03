import type { ContractType, Offer, Region } from "../types";
import { cityLabel, regionFromPlace, regionFromPostcode } from "../belgium";

/**
 * Offres du Forem publiées en open data sur le portail ODWB, mises à jour chaque jour.
 * Licence CC BY-SA 4.0 : la source est citée dans le pied de page et sur chaque offre.
 * https://www.odwb.be/explore/dataset/offres-d-emploi-forem/
 */
const DATASET =
  process.env.FOREM_DATASET_URL ??
  "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/records";

/** Code NACE 78 : activités liées à l'emploi (agences d'intérim et de recrutement). */
const AGENCY_SECTOR = "78";

const REGION_LABELS: Record<Region, string> = {
  bruxelles: "RÉGION DE BRUXELLES-CAPITALE",
  wallonie: "RÉGION WALLONNE",
  flandre: "RÉGION FLAMANDE",
};

interface Rec {
  numerooffreforem?: string;
  titreoffre?: string;
  lieuxtravaillocalite?: string[] | null;
  lieuxtravailregion?: string[] | null;
  lieuxtravailcodepostal?: string[] | null;
  typecontrat?: string | null;
  nomemployeur?: string | null;
  regimetravail?: string | null;
  niveauxetudes?: string[] | null;
  langues?: string[] | null;
  experiencerequise?: string | null;
  secteurs?: string[] | null;
  secteurscodenace?: string[] | null;
  url?: string;
  datedebutdiffusion?: string;
  metier?: string | null;
}

function mapContract(raw: string, title: string): ContractType {
  const s = raw.toLowerCase();
  const t = title.toLowerCase();
  if (/\b(alternance|apprenti\w*)\b/.test(t)) return "alternance";
  if (/\b(stage|stagiaire)\b/.test(t)) return "stage";
  if (s.includes("etudiant") || s.includes("étudiant") || s.includes("flexi")) return "etudiant";
  if (s.includes("intérim")) return "interim";
  if (s.includes("indéterminée")) return "cdi";
  if (/déterminée|remplacement|journalier|nettement/.test(s)) return "cdd";
  return "nc";
}

/** Le Forem répète parfois le nom : « BETUNED - BETUNED ». */
function cleanCompany(name: string): string {
  const [a, b] = name.split(" - ");
  return b && a.trim().toLowerCase() === b.trim().toLowerCase() ? a.trim() : name;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
}

/** Le jeu de données ne contient pas le texte de l'annonce : on résume ce qu'il décrit. */
function describe(r: Rec): string {
  return [
    r.metier,
    r.secteurs?.length ? `Secteur : ${r.secteurs.join(", ")}` : "",
    r.regimetravail,
    r.experiencerequise ? `Expérience : ${r.experiencerequise}` : "",
    r.niveauxetudes?.length ? `Études : ${r.niveauxetudes.join(", ")}` : "",
    r.langues?.length ? `Langues : ${r.langues.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function toOffer(r: Rec): Offer {
  const title = r.titreoffre ?? "";
  const postcode = r.lieuxtravailcodepostal?.[0];
  const region = (postcode && regionFromPostcode(postcode)) || regionFromPlace((r.lieuxtravailregion ?? []).join(", "));
  const contract = mapContract(r.typecontrat ?? "", title);
  return {
    id: `forem-${r.numerooffreforem}`,
    title,
    company: cleanCompany(r.nomemployeur ?? ""),
    city: titleCase(r.lieuxtravaillocalite?.[0] ?? ""),
    postcode,
    region: region ?? undefined,
    contract,
    description: describe(r),
    url: r.url ?? "https://www.leforem.be",
    source: "Le Forem",
    publishedAt: r.datedebutdiffusion ?? new Date().toISOString(),
    agency: contract === "interim" || Boolean(r.secteurscodenace?.includes(AGENCY_SECTOR)),
  };
}

async function query(params: Record<string, string>): Promise<Rec[]> {
  const res = await fetch(`${DATASET}?${new URLSearchParams(params)}`, { next: { revalidate: 3600 } }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = (await res.json()) as { results?: Rec[] };
  return data.results ?? [];
}

const quote = (s: string) => `"${s.replace(/["\\]/g, " ")}"`;

/** Coordonnées d'une commune, d'après une offre qui s'y trouve. */
async function locate(city: string): Promise<{ lon: number; lat: number } | null> {
  const name = cityLabel(city, "fr").toUpperCase();
  const res = await fetch(
    `${DATASET}?${new URLSearchParams({ select: "lieuxtravailgeo", limit: "1", where: `lieuxtravaillocalite=${quote(name)}` })}`,
    { next: { revalidate: 86400 } },
  ).catch(() => null);
  if (!res || !res.ok) return null;
  const data = (await res.json()) as { results?: { lieuxtravailgeo?: { lon: number; lat: number }[] | null }[] };
  return data.results?.[0]?.lieuxtravailgeo?.[0] ?? null;
}

export interface ForemQuery {
  what?: string;
  where?: string;
  km?: number;
  region?: Region;
}

export async function fetchForem(q: ForemQuery = {}): Promise<Offer[]> {
  const today = new Date().toISOString().slice(0, 10);
  const filters = [`lieuxtravailregion="Belgique"`, `datefindiffusion >= date'${today}'`];
  if (q.what) filters.push(quote(q.what));
  if (q.region) filters.push(`lieuxtravailregion=${quote(REGION_LABELS[q.region])}`);
  if (q.where) {
    const point = await locate(q.where);
    filters.push(
      point
        ? `within_distance(lieuxtravailgeo, geom'POINT(${point.lon} ${point.lat})', ${q.km ?? 30}km)`
        : quote(cityLabel(q.where, "fr")),
    );
  }
  const direct = `not secteurscodenace=${quote(AGENCY_SECTOR)} and not typecontrat like "Intérimaire*"`;
  const base = { order_by: "datedebutdiffusion desc", limit: "100" };
  const clause = filters.join(" and ");
  // Les offres directes d'abord : sans ce tri, les agences occuperaient presque toutes les places.
  const results = await Promise.all([
    query({ ...base, where: `${clause} and ${direct}` }),
    query({ ...base, where: `${clause} and ${direct}`, offset: "100" }),
    query({ ...base, where: clause, limit: "40" }),
  ]);
  const seen = new Set<string>();
  return results
    .flat()
    .filter((r) => (seen.has(r.numerooffreforem ?? "") ? false : seen.add(r.numerooffreforem ?? "")))
    .map(toOffer);
}
