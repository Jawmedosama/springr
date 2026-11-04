import { isAccessible } from "./accessible";
import { isGermanSpeaking } from "./belgium";
import type { ContractType, Offer, Province, Region } from "./types";

export type AdLang = "fr" | "nl" | "en";
export type Hours = "partiel" | "weekend" | "soir";
export type AreaChoice = Region | "germanophone";

export interface Filters {
  contracts: ContractType[];
  regions: AreaChoice[];
  provinces: Province[];
  /** Villes recherchées, à la place de celle du profil. */
  cities: string[];
  /** Ignore la ville du profil. */
  allBelgium: boolean;
  lang: AdLang | null;
  /** Publiée depuis moins de N jours. */
  days: number | null;
  /** Distance de recherche ; sinon celle du profil. */
  km: number | null;
  hours: Hours[];
  easy: boolean;
  hideAgencies: boolean;
}

export const NO_FILTERS: Filters = { contracts: [], regions: [], provinces: [], cities: [], allBelgium: false, lang: null, days: null, km: null, hours: [], easy: false, hideAgencies: false };

export const CONTRACT_CHOICES: ContractType[] = ["etudiant", "flexi", "stage", "alternance", "cdd", "cdi", "interim"];
export const REGION_CHOICES: AreaChoice[] = ["bruxelles", "wallonie", "flandre", "germanophone"];
export const PROVINCE_CHOICES: Province[] = ["brabant-wallon", "hainaut", "liege", "luxembourg", "namur", "anvers", "brabant-flamand", "flandre-occidentale", "flandre-orientale", "limbourg"];
export const DAY_CHOICES = [1, 7, 30];
export const KM_CHOICES = [5, 10, 30, 50, 100];
export const HOUR_CHOICES: Hours[] = ["partiel", "weekend", "soir"];
export const LANG_CHOICES: AdLang[] = ["fr", "nl", "en"];

const WORDS: Record<AdLang, RegExp> = {
  fr: /\b(le|la|les|des|une|pour|avec|nous|vous|votre|dans|sur|recherchons|h\/f)\b/gi,
  nl: /\b(het|een|voor|met|wij|jij|je|jouw|bij|zoeken|werken|ervaring|medewerker|verantwoordelijk\w*)\b/gi,
  en: /\b(the|and|with|for|you|our|your|we|are|will|manager|engineer)\b/gi,
};

/** Langue de l'annonce, estimée sur ses mots les plus courants. */
export function adLanguage(o: Offer): AdLang | null {
  if (o.source === "Le Forem") return "fr";
  const text = o.source === "Page carrières" ? o.title : `${o.title} ${o.description}`;
  const scores = (Object.keys(WORDS) as AdLang[]).map((l) => [l, text.match(WORDS[l])?.length ?? 0] as const);
  const [best, n] = [...scores].sort((a, b) => b[1] - a[1])[0];
  return n > 0 ? best : null;
}

const asksDutch = (o: Offer) => /n[ée]erlandais|nederlands|dutch|bilingue|tweetalig/i.test(`${o.title} ${o.description}`);

const HOURS: Record<Hours, RegExp> = {
  partiel: /temps partiel|mi-temps|deeltijds|part[- ]time|\b\d{1,2}\s?h(eures?)?\s?\/\s?sem/i,
  weekend: /week-?end|samedi|dimanche|zaterdag|zondag/i,
  soir: /\bsoir|soirée|avond|\bnuit\b|nacht/i,
};

const inArea = (o: Offer, a: AreaChoice) => (a === "germanophone" ? isGermanSpeaking(o) : o.region === a);

export function matchesFilters(o: Offer, f: Filters): boolean {
  if (f.contracts.length && !f.contracts.includes(o.contract)) return false;
  if (f.regions.length && !f.regions.some((a) => inArea(o, a))) return false;
  if (f.provinces.length && !(o.province && f.provinces.includes(o.province))) return false;
  if (f.lang) {
    if (adLanguage(o) !== f.lang) return false;
    if (f.lang === "fr" && asksDutch(o)) return false;
  }
  if (f.days && Date.now() - new Date(o.publishedAt).getTime() > f.days * 86400000) return false;
  if (f.hours.length && !f.hours.some((h) => HOURS[h].test(`${o.title} ${o.description}`))) return false;
  if (f.easy && !isAccessible(o)) return false;
  if (f.hideAgencies && o.agency) return false;
  return true;
}

export function activeCount(f: Filters): number {
  return f.contracts.length + f.regions.length + f.provinces.length + f.cities.length + f.hours.length + [f.allBelgium || null, f.lang, f.days, f.km, f.easy || null, f.hideAgencies || null].filter(Boolean).length;
}

/** Ce qui demande une nouvelle recherche, et non un simple tri des offres déjà chargées. */
export function searchKey(f: Filters): string {
  return JSON.stringify([f.km, f.contracts, f.regions, f.provinces, f.cities, f.allBelgium]);
}

/** Le lieu choisi dans les filtres remplace la ville du profil, sans modifier le profil. */
export function searchParams(what: string, where: string, f: Filters, profileKm?: number): URLSearchParams {
  const qs = new URLSearchParams();
  const place = f.allBelgium || f.provinces.length ? "" : f.cities.length ? f.cities.join(",") : where.trim();
  const km = f.km ?? profileKm;
  const real = f.regions.filter((r): r is Region => r !== "germanophone");
  if (what.trim()) qs.set("what", what.trim());
  if (place) qs.set("where", place);
  if (km) qs.set("km", String(km));
  if (f.contracts.length) qs.set("contracts", f.contracts.join(","));
  if (f.provinces.length) qs.set("provinces", f.provinces.join(","));
  if (real.length === 1 && !place) qs.set("region", real[0]);
  return qs;
}

const KEY = "springr.filters";

export function loadFilters(): Filters {
  try {
    return { ...NO_FILTERS, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Filters>) };
  } catch {
    return NO_FILTERS;
  }
}

export function saveFilters(f: Filters) {
  try {
    localStorage.setItem(KEY, JSON.stringify(f));
  } catch {
    /* stockage indisponible */
  }
}
