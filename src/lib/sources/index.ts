import { cityLabel } from "../belgium";
import type { ContractType, Offer, Province, Region } from "../types";
import { fetchAdzuna } from "./adzuna";
import { fetchCareerjet, fetchJooble } from "./aggregators";
import { fetchCareers } from "./careers";
import { fetchForem } from "./forem";
import { SAMPLE_OFFERS } from "./sample";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[·()\-–,./]/g, " ")
    .replace(/\b(h|f|m|v|x)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const LEGAL_FORM = /\b(sa|nv|srl|bv|sprl|bvba|asbl|vzw|scrl|cvba|sas|gmbh|ltd|inc|belgium|belgique|belgie)\b/g;
const SMALL_WORDS = new Set(["de", "du", "la", "le", "les", "des", "en", "et", "in", "the", "and", "van", "voor", "een", "un", "une", "het"]);

const companyKey = (s: string) => normalize(s).replace(LEGAL_FORM, "").replace(/\s+/g, " ").trim();
const titleWords = (s: string) => new Set(normalize(s).split(" ").filter((w) => w.length > 1 && !SMALL_WORDS.has(w)));

/** Titres presque identiques : au moins 80 % de mots communs. */
function sameTitle(a: Set<string>, b: Set<string>): boolean {
  if (!a.size || !b.size) return false;
  const common = [...a].filter((w) => b.has(w)).length;
  return common / (a.size + b.size - common) >= 0.8;
}

/** Plus une fiche donne d'informations, plus elle a de chances d'être gardée. */
function richness(o: Offer): number {
  return (
    (o.source === "Le Forem" ? 3 : 0) +
    Math.min(5, o.description.length / 200) +
    (o.salary ? 3 : 0) +
    (o.regime ? 1 : 0) +
    (o.postcode ? 1 : 0) +
    (o.contract !== "nc" ? 1 : 0)
  );
}

function merge(a: Offer, b: Offer): Offer {
  const [keep, other] = richness(b) > richness(a) ? [b, a] : [a, b];
  const others = [...(keep.altSources ?? []), ...(other.altSources ?? [])];
  if (other.url !== keep.url) others.push({ source: other.source, url: other.url });
  const alts = [...new Map(others.filter((x) => x.url !== keep.url).map((x) => [x.url, x])).values()].slice(0, 4);
  return { ...keep, salary: keep.salary ?? other.salary, altSources: alts.length ? alts : undefined };
}

/** Même entreprise, même ville et titre très proche : c'est la même offre, sur plusieurs sites. */
export function dedupe(offers: Offer[]): Offer[] {
  const buckets = new Map<string, { words: Set<string>; offer: Offer }[]>();
  const noCompany: Offer[] = [];
  for (const o of offers) {
    const company = companyKey(o.company);
    if (!company) {
      noCompany.push(o);
      continue;
    }
    const key = `${company}|${normalize(cityLabel(o.city, "fr"))}`;
    const bucket = buckets.get(key) ?? [];
    buckets.set(key, bucket);
    const words = titleWords(o.title);
    const twin = bucket.find((x) => x.offer.id === o.id || sameTitle(x.words, words));
    if (twin) twin.offer = twin.offer.id === o.id ? twin.offer : merge(twin.offer, o);
    else bucket.push({ words, offer: o });
  }
  const byId = new Map(noCompany.map((o) => [o.id, o]));
  return [...[...buckets.values()].flat().map((x) => x.offer), ...byId.values()];
}

/** Âge maximal quand la source n'annonce pas de fin. Les pages carrières sont lues en direct : une offre retirée n'y est plus. */
const MAX_AGE_DAYS: Record<string, number> = { "Le Forem": 90, "Page carrières": Infinity };
const DEFAULT_MAX_AGE = 60;

export function isExpired(o: Offer, now = Date.now()): boolean {
  if (o.expiresAt) return new Date(`${o.expiresAt.slice(0, 10)}T23:59:59Z`).getTime() < now;
  const age = (now - new Date(o.publishedAt).getTime()) / 86400000;
  return age > (MAX_AGE_DAYS[o.source] ?? DEFAULT_MAX_AGE);
}

/** Agences d'intérim, de recrutement, sites d'emploi et organismes de formation : on ne garde que les offres d'entreprises. */
const INTERMEDIARIES =
  /^impact\b|\b(randstad|adecco|manpower|start ?people|tempo[- ]?team|unique interim|accent|synergie|daoust|trace|express medical|agilitas|hays|michael page|page personnel|robert half|t-interim|actief|asap|vivaldis|konvert|select human|ago jobs|crit|axxon|solvus|go4jobs|bright plus|itzu|dajobs|trixxo|let'?s work|superprof|job ?& ?talent|ctrl-f|triangle solutions|demain selection|werkenvoor|interim|intérim|recruitment|recruiting|recrutement|staffing|headhunt\w*|executive search|uitzend\w*|werving|selectie|rh|hr|human resources|centre de formation|ifapme|syntra)\b|\bjobs?$|\.be$/i;

/** Formules typiques d'une annonce publiée pour le compte d'un tiers. */
const THIRD_PARTY = /\b(pour (le compte de )?notre client|notre client recherche|pour l'un de nos clients|voor onze klant|onze klant zoekt|for our client)\b/i;

export function isIntermediary(o: Offer): boolean {
  return Boolean(o.agency) || o.contract === "interim" || INTERMEDIARIES.test(o.company.trim()) || THIRD_PARTY.test(o.description);
}

export interface OfferQuery {
  what?: string;
  where?: string;
  /** Distance maximale autour de la ville, en km. */
  km?: number;
  contracts?: ContractType[];
  /** Région entière, quand aucune ville n'est choisie. */
  region?: Region;
  provinces?: Province[];
  /** Toutes les offres du Forem qui correspondent, pour les classer avant de paginer. */
  all?: boolean;
}

const ADZUNA_PROVINCES: Record<Province, string> = {
  anvers: "Antwerpen",
  "brabant-flamand": "Vlaams-Brabant",
  "brabant-wallon": "Waals-Brabant",
  "flandre-occidentale": "West-Vlaanderen",
  "flandre-orientale": "Oost-Vlaanderen",
  hainaut: "Henegouwen",
  liege: "Luik",
  limbourg: "Limburg",
  luxembourg: "Luxemburg",
  namur: "Namen",
};

export interface OffersResult {
  offers: Offer[];
  demo: boolean;
  /** Offres d'intermédiaires, écartées par défaut : l'utilisateur peut choisir de les afficher. */
  agencies: Offer[];
  /** Offres retirées avant l'affichage. */
  removed: { duplicates: number; expired: number };
}

const FLEXI = /\bflexi\b|\bflexi[- ]?jobs?\b/i;
const STUDENT = /\b(jobiste|job[- ]étudiant|job[- ]etudiant|contrat étudiant|contrat etudiant|étudiante?s?|etudiante?s?|studentenjob|jobstudent|student)\b/i;

/** Beaucoup de sources ne donnent pas le contrat : le texte de l'annonce le dit souvent. */
function inferContract(o: Offer): Offer {
  if (o.contract !== "nc") return o;
  const text = `${o.title} ${o.description}`;
  if (FLEXI.test(text)) return { ...o, contract: "flexi" };
  return STUDENT.test(text) ? { ...o, contract: "etudiant" } : o;
}

function finish(results: PromiseSettledResult<Offer[]>[]): OffersResult {
  const live = results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])).map(inferContract);
  const fresh = live.filter((o) => !isExpired(o));
  const all = live.length === 0 ? SAMPLE_OFFERS : dedupe(fresh);
  const offers = all.filter((o) => !isIntermediary(o));
  const agencies = all.filter(isIntermediary).map((o) => ({ ...o, agency: true }));
  const removed = { duplicates: live.length ? fresh.length - all.length : 0, expired: live.length - fresh.length };
  return { offers, agencies, removed, demo: live.length === 0 };
}

/** Jooble et Careerjet, intérim compris : le tri se fait ensuite avec les filtres. */
function aggregators(what: string, where: string, km: number): Promise<Offer[]>[] {
  return [1, 2, 3, 4, 5].flatMap((page) => [fetchJooble(what, where, km, page), fetchCareerjet(what, where, page)]);
}

export async function getAllOffers(q: OfferQuery = {}): Promise<OffersResult> {
  const what = q.what?.trim() ?? "";
  const places = (q.where ?? "").split(",").map((c) => c.trim()).filter(Boolean).slice(0, 5);
  const km = Math.min(200, Math.max(5, q.km ?? 30));
  const contracts = q.contracts;
  const all = q.all;

  // Plusieurs provinces : une recherche par province.
  if (q.provinces?.length) {
    const calls = q.provinces.slice(0, 5).flatMap((province) => [
      fetchForem({ what, contracts, province, all }),
      fetchAdzuna(what, 1, ADZUNA_PROVINCES[province], 30),
      ...aggregators(what, ADZUNA_PROVINCES[province], 30),
    ]);
    return finish(await Promise.allSettled([...calls, fetchCareers({ what })]));
  }

  // Plusieurs villes : une recherche par ville, avec le même rayon.
  if (places.length > 1) {
    const calls = places.flatMap((where) => [
      fetchForem({ what, where, km, contracts, all }),
      fetchAdzuna(what, 1, where, km),
      fetchCareers({ what, where }),
      ...aggregators(what, where, km),
    ]);
    return finish(await Promise.allSettled(calls));
  }

  const where = places[0] ?? "";
  const calls: Promise<Offer[]>[] = [
    fetchForem({ what, where, km, contracts, region: q.region, all }),
    fetchAdzuna(what, 1, where, km),
    fetchAdzuna(what, 2, where, km),
    fetchAdzuna(what, 3, where, km),
    fetchAdzuna(what, 4, where, km),
    fetchAdzuna(what, 5, where, km),
  ];
  // Métier + ville : on complète avec tout ce qui recrute dans la zone, sans dépasser la distance choisie.
  if (what && where) calls.push(fetchAdzuna("", 1, where, km));
  calls.push(fetchCareers({ what, where, region: q.region }), ...aggregators(what, where, km));
  return finish(await Promise.allSettled(calls));
}

const REGION_CITIES: Record<Region, string[]> = {
  bruxelles: ["Bruxelles"],
  wallonie: ["Liège", "Namur", "Charleroi", "Mons", "Wavre"],
  flandre: ["Antwerpen", "Gent", "Leuven", "Brugge", "Hasselt"],
};

/** Recherche large pour la page Entreprises : toute une région, sans filtre de métier. */
export async function getRegionOffers(region?: Region): Promise<OffersResult> {
  const cities = region ? REGION_CITIES[region] : [""];
  const calls =
    cities.length > 1
      ? cities.map((c) => fetchAdzuna("", 1, c, 30))
      : [1, 2, 3, 4, 5].map((p) => fetchAdzuna("", p, cities[0], 30));
  return finish(await Promise.allSettled([fetchForem({ region, all: true }), fetchCareers({ region }), ...calls]));
}
