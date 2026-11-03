import type { Region } from "./types";

/**
 * Les codes postaux belges vont de 1000 à 9992.
 * 1000-1299 : Région de Bruxelles-Capitale
 * 1300-1499 : Brabant wallon
 * 1500-3999 : Brabant flamand, Anvers, Limbourg
 * 4000-7999 : Liège, Namur, Luxembourg, Hainaut
 * 8000-9999 : Flandre occidentale et orientale
 */
export function regionFromPostcode(postcode: string): Region | null {
  if (!/^\d{4}$/.test(postcode)) return null;
  const n = Number(postcode);
  if (n < 1000 || n > 9992) return null;
  if (n < 1300) return "bruxelles";
  if (n < 1500) return "wallonie";
  if (n < 4000) return "flandre";
  if (n < 8000) return "wallonie";
  return "flandre";
}

export const MIN_AGE = 16;
export const MAX_AGE = 35;

export function ageFrom(birthDate: string, today = new Date()): number | null {
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export function isEligibleAge(birthDate: string): boolean {
  const age = ageFrom(birthDate);
  return age !== null && age >= MIN_AGE && age <= MAX_AGE;
}

/** Quota annuel de travail étudiant à cotisations réduites (en heures). */
export const STUDENT_HOURS_QUOTA = 650;
