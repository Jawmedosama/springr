import type { Offer } from "../types";
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

/** Agences d'intérim, de recrutement et organismes de formation : on ne garde que les offres d'entreprises. */
const INTERMEDIARIES =
  /\b(randstad|adecco|manpower|start ?people|tempo[- ]?team|unique interim|accent|synergie|daoust|trace|express medical|agilitas|hays|michael page|page personnel|robert half|t-interim|actief|asap|vivaldis|konvert|select human|ago jobs|crit|axxon|solvus|go4jobs|bright plus|interim|intérim|recruitment|recrutement|staffing|uitzend|centre de formation|ifapme|syntra)\b/i;

export function isIntermediary(o: Offer): boolean {
  return o.contract === "interim" || INTERMEDIARIES.test(o.company);
}

export interface OfferQuery {
  what?: string;
  where?: string;
}

export interface OffersResult {
  offers: Offer[];
  demo: boolean;
  /** Nombre d'offres d'intermédiaires écartées. */
  filtered: number;
}

export async function getAllOffers(q: OfferQuery = {}): Promise<OffersResult> {
  const what = q.what?.trim() ?? "";
  const where = q.where?.trim() ?? "";
  const calls: Promise<Offer[]>[] = [fetchForem(), fetchAdzuna(what, 1, where), fetchAdzuna(what, 2, where)];
  // Recherche ciblée : on complète avec des offres plus larges (même métier partout, ou tout dans la ville).
  if (what && where) calls.push(fetchAdzuna(what, 1), fetchAdzuna("", 1, where));
  else if (what || where) calls.push(fetchAdzuna("", 1));
  const results = await Promise.allSettled(calls);
  const live = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const all = live.length === 0 ? SAMPLE_OFFERS : dedupe(live);
  const offers = all.filter((o) => !isIntermediary(o));
  return { offers, demo: live.length === 0, filtered: all.length - offers.length };
}
