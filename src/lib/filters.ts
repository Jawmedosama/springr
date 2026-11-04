import { isAccessible } from "./accessible";
import type { ContractType, Offer } from "./types";

export type AdLang = "fr" | "nl" | "en";
export type Hours = "partiel" | "weekend" | "soir";

export interface Filters {
  contracts: ContractType[];
  lang: AdLang | null;
  /** Publiée depuis moins de N jours. */
  days: number | null;
  /** Distance de recherche ; sinon celle du profil. */
  km: number | null;
  hours: Hours[];
  easy: boolean;
  hideAgencies: boolean;
}

export const NO_FILTERS: Filters = { contracts: [], lang: null, days: null, km: null, hours: [], easy: false, hideAgencies: false };

export const CONTRACT_CHOICES: ContractType[] = ["etudiant", "flexi", "stage", "alternance", "cdd", "cdi", "interim"];
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

export function matchesFilters(o: Offer, f: Filters): boolean {
  if (f.contracts.length && !f.contracts.includes(o.contract)) return false;
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
  return f.contracts.length + f.hours.length + [f.lang, f.days, f.km, f.easy || null, f.hideAgencies || null].filter(Boolean).length;
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
