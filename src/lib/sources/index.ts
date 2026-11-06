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
    .replace(/[̀-ͯ]/g, "")
    .replace(/[·()\-–,./]/g, " ")
    .replace(/\b(h|f|m|x)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Deux offres sont des doublons si l'entreprise, le titre et la ville normalisés sont identiques. */
export function dedupe(offers: Offer[]): Offer[] {
  const seen = new Map<string, Offer>();
  for (const o of offers) {
    const key = [normalize(o.company), normalize(o.title), normalize(cityLabel(o.city, "fr"))].join("|");
    const prev = seen.get(key);
    // On garde l'offre la plus récente, ou celle d'une source officielle.
    const official = (x: Offer) => x.source === "Le Forem";
    const better =
      !prev ||
      (official(o) && !official(prev)) ||
      (official(o) === official(prev) && o.publishedAt > prev.publishedAt);
    if (better) {
      seen.set(key, o);
    }
  }
  return [...seen.values()];
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
  const all = live.length === 0 ? SAMPLE_OFFERS : dedupe(live);
  const offers = all.filter((o) => !isIntermediary(o));
  const agencies = all.filter(isIntermediary).map((o) => ({ ...o, agency: true }));
  return { offers, agencies, demo: live.length === 0 };
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
