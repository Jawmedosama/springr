import { matchesFilters, type Filters } from "../filters";
import { matchOffer } from "../match";
import type { ContractType, Lang, MatchProfile, Offer, Province, Region } from "../types";
import { getAllOffers } from "./index";

const PAGE_SIZE = 100;

export interface FeedRequest {
  what?: string;
  where?: string;
  km?: number;
  contracts?: ContractType[];
  region?: Region;
  provinces?: Province[];
  filters: Filters;
  /** Sans les coordonnées : seulement ce qui sert au score. */
  profile?: (Omit<MatchProfile, "cvText"> & { experienced?: boolean }) | null;
  lang: Lang;
  page?: number;
}

export interface FeedResult {
  offers: Offer[];
  total: number;
  hiddenByFrench: number;
  hasMore: boolean;
  demo: boolean;
}

/** Filtre puis classe toutes les offres, et seulement ensuite découpe en pages. */
export async function getFeed(r: FeedRequest): Promise<FeedResult> {
  const { offers, agencies, demo } = await getAllOffers({ ...r, all: true });
  const all = [...offers, ...agencies];
  const kept = all.filter((o) => matchesFilters(o, r.filters));
  const hiddenByFrench = r.filters.lang === "fr" ? all.filter((o) => matchesFilters(o, { ...r.filters, lang: null })).length - kept.length : 0;

  const p = r.profile;
  const forScore = p ? { ...p, cvText: p.experienced ? "x".repeat(400) : "" } : null;
  const ranked = kept
    .map((offer) => ({ offer, score: forScore ? matchOffer(offer, forScore, r.lang).score : 0 }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(a.offer.agency ?? false) - Number(b.offer.agency ?? false) ||
        b.offer.publishedAt.localeCompare(a.offer.publishedAt),
    );

  const page = r.page ?? 0;
  const slice = ranked.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((x) => x.offer);
  return { offers: slice, total: ranked.length, hiddenByFrench, hasMore: (page + 1) * PAGE_SIZE < ranked.length, demo };
}
