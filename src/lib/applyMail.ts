"use client";

import type { Lang, Offer, Profile } from "./types";

export interface MailTemplate {
  subject: string;
  body: string;
}

const DEFAULTS: Record<Lang, MailTemplate> = {
  fr: {
    subject: "Candidature : {poste}",
    body: `Madame, Monsieur,

Je vous adresse ma candidature pour le poste de {poste} chez {entreprise}. Vous trouverez mon CV en pièce jointe.

Motivé·e et disponible rapidement, je serais ravi·e d'échanger avec vous lors d'un entretien.

Bien à vous,
{prenom} {nom}`,
  },
  nl: {
    subject: "Sollicitatie: {poste}",
    body: `Geachte heer, mevrouw,

Graag stel ik mij kandidaat voor de functie van {poste} bij {entreprise}. Mijn cv vindt u in bijlage.

Ik ben gemotiveerd en snel beschikbaar, en licht mijn kandidatuur graag toe tijdens een gesprek.

Met vriendelijke groeten,
{prenom} {nom}`,
  },
};

const KEY = "springr.mail";

export function loadTemplate(lang: Lang): MailTemplate {
  try {
    return { ...DEFAULTS[lang], ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<MailTemplate>) };
  } catch {
    return DEFAULTS[lang];
  }
}

export function saveTemplate(t: MailTemplate) {
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    /* stockage indisponible */
  }
}

export function resetTemplate(lang: Lang): MailTemplate {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible */
  }
  return DEFAULTS[lang];
}

export function fillTemplate(text: string, offer: Offer, profile: Profile): string {
  return text
    .replaceAll("{poste}", offer.title)
    .replaceAll("{entreprise}", offer.company)
    .replaceAll("{prenom}", profile.firstName)
    .replaceAll("{nom}", profile.lastName);
}

/* Le PDF du CV reste dans le navigateur (IndexedDB) : il n'est envoyé qu'au moment d'une candidature. */

const DB = "springr";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export const saveCvFile = (file: File) => withStore("readwrite", (s) => s.put(file, "cv"));
export const loadCvFile = () => withStore<File | undefined>("readonly", (s) => s.get("cv"));
export const removeCvFile = () => withStore("readwrite", (s) => s.delete("cv"));

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}
