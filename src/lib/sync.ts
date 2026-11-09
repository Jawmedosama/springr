"use client";

import { setStoreListener, store, type StoreChange } from "./store";
import { getSupabase } from "./supabase";
import type { Application, Offer, Profile, Region } from "./types";

/**
 * Synchronisation entre le navigateur et Supabase.
 * Le navigateur reste la copie de travail ; chaque changement est renvoyé au compte.
 */
type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  birth_date: string;
  street: string;
  house_number: string;
  postcode: string;
  city: string;
  region: Region;
  declared_resident: boolean;
  study_level: string | null;
  field: string | null;
  skills: string[] | null;
  languages: string[] | null;
  contracts: Profile["contracts"] | null;
  mobility_km: number | null;
  cv_text: string | null;
  created_at: string;
};

type AppRow = {
  user_id: string;
  offer_id: string;
  offer: Offer;
  status: Application["status"];
  remind_at: string | null;
  notes: string | null;
  letter: string | null;
  cv: string | null;
  spontaneous: boolean;
  updated_at: string;
};

const toProfileRow = (p: Profile, id: string): ProfileRow => ({
  id,
  first_name: p.firstName,
  last_name: p.lastName,
  birth_date: p.birthDate,
  street: p.street,
  house_number: p.number,
  postcode: p.postcode,
  city: p.city,
  region: p.region,
  // Plus demandée à l'inscription ; la colonne reste pour les anciens comptes.
  declared_resident: true,
  study_level: p.studyLevel,
  field: p.field,
  skills: p.skills,
  languages: p.languages,
  contracts: p.contracts,
  mobility_km: p.mobilityKm,
  cv_text: p.cvText ?? null,
  created_at: p.createdAt,
});

const fromProfileRow = (r: ProfileRow, email: string): Profile => ({
  firstName: r.first_name,
  lastName: r.last_name,
  email,
  phone: r.phone ?? undefined,
  birthDate: r.birth_date,
  street: r.street,
  number: r.house_number,
  postcode: r.postcode,
  city: r.city,
  region: r.region,
  declaredResident: r.declared_resident,
  studyLevel: r.study_level ?? "",
  field: r.field ?? "",
  skills: r.skills ?? [],
  languages: r.languages ?? [],
  contracts: r.contracts ?? [],
  mobilityKm: r.mobility_km ?? 30,
  cvText: r.cv_text ?? undefined,
  createdAt: r.created_at,
});

const toAppRow = (a: Application, id: string): AppRow => ({
  user_id: id,
  offer_id: a.offer.id,
  offer: a.offer,
  status: a.status,
  remind_at: a.remindAt ?? null,
  notes: a.notes ?? null,
  letter: a.letter ?? null,
  cv: a.cv ?? null,
  spontaneous: Boolean(a.spontaneous),
  updated_at: a.updatedAt,
});

const fromAppRow = (r: AppRow): Application => ({
  offer: r.offer,
  status: r.status,
  updatedAt: r.updated_at,
  remindAt: r.remind_at ?? undefined,
  notes: r.notes ?? undefined,
  letter: r.letter ?? undefined,
  cv: r.cv ?? undefined,
  spontaneous: r.spontaneous,
});

let userId: string | null = null;
const timers: Partial<Record<"profile" | "apps" | "seen", ReturnType<typeof setTimeout>>> = {};

let lastError: string | null = null;

function report(what: string, error: { message: string } | null | undefined) {
  if (!error) return;
  lastError = what;
  console.error(`Synchronisation ${what} : ${error.message}`);
}

async function pushProfile(id: string) {
  const p = store.getProfile();
  if (p) report("profil", (await getSupabase()?.from("profiles").upsert(toProfileRow(p, id)))?.error);
}

async function pushApps(id: string) {
  const rows = store.getApps().map((a) => toAppRow(a, id));
  if (rows.length) report("candidatures", (await getSupabase()?.from("applications").upsert(rows))?.error);
}

async function pushSeen(id: string) {
  const rows = [...store.getSeen()].map((offer_id) => ({ user_id: id, offer_id }));
  if (rows.length) report("offres vues", (await getSupabase()?.from("seen_offers").upsert(rows, { ignoreDuplicates: true }))?.error);
}

/** Le profil d'abord : les candidatures et les offres vues y sont rattachées. */
async function pushAll(id: string) {
  // Sans profil, rien ne peut encore être rattaché : un invité garde tout ici jusqu'à son inscription.
  if (!store.getProfile()) return;
  await pushProfile(id);
  await Promise.all([pushApps(id), pushSeen(id)]);
}

function onChange(change: StoreChange) {
  const sb = getSupabase();
  const id = userId;
  if (!sb || !id) return;
  if (change.kind === "appRemoved") {
    // Une requête Supabase ne part que lorsqu'on attend son résultat.
    sb.from("applications").delete().match({ user_id: id, offer_id: change.id }).then(({ error }) => report("suppression", error));
    return;
  }
  if (change.kind === "seenReset") {
    sb.from("seen_offers").delete().eq("user_id", id).then(({ error }) => report("offres vues", error));
    return;
  }
  const push = { profile: pushAll, apps: pushApps, seen: pushSeen }[change.kind];
  clearTimeout(timers[change.kind]);
  timers[change.kind] = setTimeout(() => void push(id), 300);
}

/**
 * À la connexion : récupère le compte et le fusionne avec ce qui est dans le navigateur.
 * Ce qu'une personne a fait avant de créer son compte est ainsi repris.
 * Renvoie true si l'affichage doit être rechargé.
 */
export async function attach(id: string, email: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const [profile, apps, seen] = await Promise.all([
    sb.from("profiles").select("*").eq("id", id).maybeSingle<ProfileRow>(),
    sb.from("applications").select("*").eq("user_id", id).returns<AppRow[]>(),
    sb.from("seen_offers").select("offer_id").eq("user_id", id).returns<{ offer_id: string }[]>(),
  ]);
  if (profile.error || apps.error || seen.error) {
    report("lecture", profile.error ?? apps.error ?? seen.error);
    return false;
  }

  const hadProfile = Boolean(store.getProfile());
  const localApps = store.getApps();

  if (profile.data) store.setProfile(fromProfileRow(profile.data, email));

  const merged = new Map(localApps.map((a) => [a.offer.id, a]));
  for (const a of (apps.data ?? []).map(fromAppRow)) {
    const mine = merged.get(a.offer.id);
    if (!mine || a.updatedAt > mine.updatedAt) merged.set(a.offer.id, a);
  }
  store.setApps([...merged.values()].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)));
  (seen.data ?? []).forEach((s) => store.markSeen(s.offer_id));

  userId = id;
  setStoreListener(onChange);
  await pushAll(id);
  window.dispatchEvent(new Event("springr:synced"));
  return hadProfile !== Boolean(store.getProfile()) || merged.size !== localApps.length;
}

/** Bouton « Synchroniser maintenant » : relit le compte et lui renvoie tout. */
export async function syncNow(): Promise<{ ok: boolean; changed: boolean; count: number }> {
  const { data } = (await getSupabase()?.auth.getSession()) ?? {};
  const user = data?.session?.user;
  if (!user) return { ok: false, changed: false, count: 0 };
  lastError = null;
  const changed = await attach(user.id, user.email ?? "");
  return { ok: !lastError, changed, count: store.getApps().length };
}

export function detach() {
  userId = null;
  setStoreListener(null);
}

/** Déconnexion : le navigateur est vidé, les données restent sur le compte. */
export async function signOut() {
  detach();
  await getSupabase()?.auth.signOut();
  store.clearAll();
}

/** Supprime le compte et toutes ses données (droit à l'effacement). */
export async function deleteAccount() {
  const sb = getSupabase();
  detach();
  if (sb) {
    await sb.rpc("delete_my_account");
    await sb.auth.signOut();
  }
  store.clearAll();
}
