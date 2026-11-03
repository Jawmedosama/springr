"use client";

import type { Application, Offer, Profile } from "./types";

/**
 * Stockage local du prototype (dans le navigateur).
 * À remplacer par Supabase (voir supabase/schema.sql) quand le projet sera en ligne.
 */
const K = { profile: "springr.profile", apps: "springr.apps", seen: "springr.seen" };

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

export const store = {
  getProfile: () => read<Profile | null>(K.profile, null),
  setProfile: (p: Profile) => write(K.profile, p),
  getApps: () => read<Application[]>(K.apps, []),
  setApps: (a: Application[]) => write(K.apps, a),
  getSeen: () => new Set(read<string[]>(K.seen, [])),
  markSeen: (id: string) => {
    const s = read<string[]>(K.seen, []);
    if (!s.includes(id)) write(K.seen, [...s, id]);
  },
  saveOffer: (offer: Offer) => {
    const apps = read<Application[]>(K.apps, []);
    if (apps.some((a) => a.offer.id === offer.id)) return;
    const remind = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    write(K.apps, [
      { offer, status: "a_postuler", updatedAt: new Date().toISOString(), remindAt: remind },
      ...apps,
    ]);
  },
};
