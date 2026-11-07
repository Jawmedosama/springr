import { matchesFilters, type Filters } from "../filters";
import { matchOffer } from "../match";
import type { Taste } from "../taste";
import type { ContractType, Lang, MatchProfile, Offer, Province, Region } from "../types";
import { getAllOffers } from "./index";

const PAGE_SIZE = 100;
/** Le texte complet reste sur le site d'origine : un extrait suffit dans le fil, et la page charge bien plus vite. */
const DESC_MAX = 900;
const short = (o: Offer): Offer => (o.description.length > DESC_MAX ? { ...o, description: `${o.description.slice(0, DESC_MAX).trimEnd()}…` } : o);
/** Pour le classement seulement : à score proche, une offre d'employeur passe avant une agence. */
const AGENCY_RANK_PENALTY = 25;

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
  /** Position de départ et nombre d'offres : la première vague est petite, pour s'afficher vite sur téléphone. */
  offset?: number;
  size?: number;
  /** Date de la dernière visite, pour compter les nouvelles offres. */
  since?: string;
  /** Préférences apprises dans le navigateur : utilisées pour trier, jamais conservées. */
  taste?: Taste | null;
}

export interface FeedResult {
  offers: Offer[];
  total: number;
  hiddenByFrench: number;
  newCount: number;
  hasMore: boolean;
  demo: boolean;
  removed: { duplicates: number; expired: number };
}

/** Filtre puis classe toutes les offres, et seulement ensuite découpe en pages. */
export async function getFeed(r: FeedRequest): Promise<FeedResult> {
  const { offers, agencies, demo, removed } = await getAllOffers({ ...r, all: true });
  const all = [...offers, ...agencies];
  const kept = all.filter((o) => matchesFilters(o, r.filters));
  const hiddenByFrench = r.filters.lang === "fr" ? all.filter((o) => matchesFilters(o, { ...r.filters, lang: null })).length - kept.length : 0;

  const p = r.profile;
  const forScore = p ? { ...p, cvText: p.experienced ? "x".repeat(400) : "" } : null;
  const ranked = kept
    .map((offer) => ({ offer, score: (forScore ? matchOffer(offer, forScore, r.lang, r.taste).score : 0) - (offer.agency ? AGENCY_RANK_PENALTY : 0) }))
    .sort((a, b) => b.score - a.score || b.offer.publishedAt.localeCompare(a.offer.publishedAt));

  const size = Math.min(PAGE_SIZE, Math.max(1, Number(r.size) || PAGE_SIZE));
  const start = r.offset !== undefined ? Math.max(0, Number(r.offset) || 0) : (r.page ?? 0) * PAGE_SIZE;
  const slice = ranked.slice(start, start + size).map((x) => short(x.offer));
  // Les sources n'écrivent pas leurs dates pareil : on compare des instants, pas du texte.
  const since = r.since ? Date.parse(r.since) : NaN;
  const newCount = Number.isNaN(since) ? 0 : kept.filter((o) => Date.parse(o.publishedAt) > since).length;
  return { offers: slice, total: ranked.length, hiddenByFrench, newCount, hasMore: start + size < ranked.length, demo, removed };
}
