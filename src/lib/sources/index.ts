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

export async function getAllOffers(): Promise<{ offers: Offer[]; demo: boolean }> {
  const results = await Promise.allSettled([fetchForem(), fetchAdzuna()]);
  const live = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (live.length === 0) return { offers: SAMPLE_OFFERS, demo: true };
  return { offers: dedupe(live), demo: false };
}
