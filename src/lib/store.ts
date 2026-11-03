"use client";

import type { Application, Offer, Profile } from "./types";

/**
 * Stockage local du prototype (dans le navigateur).
 * À remplacer par Supabase (voir supabase/schema.sql) quand le projet sera en ligne.
 */
const K = { profile: "springr.profile", apps: "springr.apps", seen: "springr.seen" };

/** Délai avant la relance proposée, en jours. */
export const FOLLOW_UP_DAYS = 7;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible */
  }
}

export type StoreChange =
  | { kind: "profile" | "apps" | "seen" }
  | { kind: "appRemoved"; id: string }
  | { kind: "seenReset" };

let listener: ((c: StoreChange) => void) | null = null;

/** Prévenu à chaque changement, pour la synchronisation avec le compte. */
export function setStoreListener(l: typeof listener) {
  listener = l;
}

export function inDays(days: number): string {
  return new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 10);
}

export const store = {
  getProfile: () => read<Profile | null>(K.profile, null),
  setProfile: (p: Profile) => {
    write(K.profile, p);
    listener?.({ kind: "profile" });
  },
  getApps: () => read<Application[]>(K.apps, []),
  setApps: (a: Application[]) => {
    write(K.apps, a);
    listener?.({ kind: "apps" });
  },
  removeApp: (id: string) => {
    write(K.apps, read<Application[]>(K.apps, []).filter((a) => a.offer.id !== id));
    listener?.({ kind: "appRemoved", id });
  },
  getSeen: () => new Set(read<string[]>(K.seen, [])),
  markSeen: (id: string) => {
    const s = read<string[]>(K.seen, []);
    if (s.includes(id)) return;
    write(K.seen, [...s, id]);
    listener?.({ kind: "seen" });
  },
  resetSeen: () => {
    write(K.seen, []);
    listener?.({ kind: "seenReset" });
  },
  /** Ajoute l'offre au suivi, ou met à jour la candidature existante. */
  saveOffer: (offer: Offer, patch: Partial<Application> = {}) => {
    const apps = read<Application[]>(K.apps, []);
    const now = new Date().toISOString();
    const i = apps.findIndex((a) => a.offer.id === offer.id);
    if (i >= 0) {
      apps[i] = { ...apps[i], ...patch, updatedAt: now };
      write(K.apps, apps);
      listener?.({ kind: "apps" });
      return;
    }
    write(K.apps, [
      { offer, status: "a_postuler", updatedAt: now, remindAt: inDays(FOLLOW_UP_DAYS), ...patch },
      ...apps,
    ]);
    listener?.({ kind: "apps" });
  },
  clearAll: () => {
    try {
      Object.values(K).forEach((k) => localStorage.removeItem(k));
    } catch {
      /* stockage indisponible */
    }
  },
};
