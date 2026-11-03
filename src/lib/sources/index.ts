import type { Offer, Region } from "../types";
import { fetchAdzuna } from "./adzuna";
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
    const key = [normalize(o.company), normalize(o.title), normalize(o.city)].join("|");
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
  /^impact\b|\b(randstad|adecco|manpower|start ?people|tempo[- ]?team|unique interim|accent|synergie|daoust|trace|express medical|agilitas|hays|michael page|page personnel|robert half|t-interim|actief|asap|vivaldis|konvert|select human|ago jobs|crit|axxon|solvus|go4jobs|bright plus|itzu|dajobs|superprof|job ?& ?talent|ctrl-f|triangle solutions|demain selection|werkenvoor|interim|intérim|recruitment|recruiting|recrutement|staffing|headhunt\w*|executive search|uitzend\w*|werving|selectie|rh|hr|human resources|centre de formation|ifapme|syntra)\b|\bjobs?$|\.be$/i;

/** Formules typiques d'une annonce publiée pour le compte d'un tiers. */
const THIRD_PARTY = /\b(notre client|nos clients|pour le compte de|onze klant|onze klanten|our client)\b/i;

export function isIntermediary(o: Offer): boolean {
  return o.contract === "interim" || INTERMEDIARIES.test(o.company.trim()) || THIRD_PARTY.test(o.description);
}

export interface OfferQuery {
  what?: string;
  where?: string;
  /** Distance maximale autour de la ville, en km. */
  km?: number;
}

export interface OffersResult {
  offers: Offer[];
  demo: boolean;
  /** Nombre d'offres d'intermédiaires écartées. */
  filtered: number;
}

function finish(results: PromiseSettledResult<Offer[]>[]): OffersResult {
  const live = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const all = live.length === 0 ? SAMPLE_OFFERS : dedupe(live);
  const offers = all.filter((o) => !isIntermediary(o));
  return { offers, demo: live.length === 0, filtered: all.length - offers.length };
}

export async function getAllOffers(q: OfferQuery = {}): Promise<OffersResult> {
  const what = q.what?.trim() ?? "";
  const where = q.where?.trim() ?? "";
  const km = Math.min(200, Math.max(5, q.km ?? 30));
  const calls: Promise<Offer[]>[] = [fetchForem(), fetchAdzuna(what, 1, where, km), fetchAdzuna(what, 2, where, km)];
  // Métier + ville : on complète avec tout ce qui recrute dans la zone, sans dépasser la distance choisie.
  if (what && where) calls.push(fetchAdzuna("", 1, where, km));
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
  return finish(await Promise.allSettled([fetchForem(), ...calls]));
}
