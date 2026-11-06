import type { Offer, Profile } from "./types";

/** Coordonnées approximatives : postcodes, débuts de postcodes et communes. */
export interface Geo {
  p: Record<string, [number, number]>;
  r: Record<string, [number, number]>;
  c: Record<string, [number, number]>;
}

export const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z]+/g, " ").trim();

function locate(geo: Geo, postcode?: string, city?: string): [number, number] | null {
  return (postcode && geo.p[postcode]) || (city && geo.c[fold(city)]) || (postcode && geo.r[postcode.slice(0, 2)]) || null;
}

function crowKm([a, b]: [number, number], [c, d]: [number, number]): number {
  const rad = Math.PI / 180;
  const h = Math.sin(((c - a) * rad) / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(((d - b) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export interface Travel {
  km: number;
  car: number;
  transit: number;
}

/** Estimation à vol d'oiseau, corrigée pour la route. Ce n'est pas un calcul d'itinéraire. */
export function travelTo(o: Offer, p: Profile, geo: Geo): Travel | null {
  const from = locate(geo, p.postcode, p.city);
  const to = o.lat !== undefined && o.lon !== undefined ? ([o.lat, o.lon] as [number, number]) : locate(geo, o.postcode, o.city);
  if (!from || !to) return null;
  const crow = crowKm(from, to);
  const road = crow * 1.3;
  return { km: Math.max(1, Math.round(crow)), car: Math.round((road / 55) * 60) + 5, transit: Math.round((road / 28) * 60) + 15 };
}

export function minutes(n: number): string {
  return n < 60 ? `${n} min` : `${Math.floor(n / 60)} h ${String(n % 60).padStart(2, "0")}`;
}
