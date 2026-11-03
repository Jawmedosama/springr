import type { ContractType, Offer } from "../types";
import { regionFromPostcode } from "../belgium";

type Rec = Record<string, unknown>;

function pick(r: Rec, keys: string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  }
  return "";
}

function mapContract(raw: string): ContractType {
  const s = raw.toLowerCase();
  if (s.includes("étudiant") || s.includes("etudiant")) return "etudiant";
  if (s.includes("stage")) return "stage";
  if (s.includes("altern")) return "alternance";
  if (s.includes("intérim") || s.includes("interim")) return "interim";
  if (s.includes("indéterminée") || s.includes("cdi")) return "cdi";
  if (s.includes("déterminée") || s.includes("cdd")) return "cdd";
  return "nc";
}

/**
 * Offres du Forem publiées en open data sur le portail ODWB (Opendatasoft).
 * FOREM_DATASET_URL doit pointer vers l'endpoint « records » du jeu de données, par exemple
 * https://www.odwb.be/api/explore/v2.1/catalog/datasets/<id>/records
 * Les noms de champs exacts sont à confirmer une fois l'accès vérifié : la fonction
 * essaie plusieurs noms probables.
 */
export async function fetchForem(limit = 100): Promise<Offer[]> {
  const base = process.env.FOREM_DATASET_URL;
  if (!base) return [];
  const res = await fetch(`${base}?limit=${limit}&order_by=-datedebutdiffusion`, {
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) return [];
  const data = (await res.json()) as { results?: Rec[] };
  return (data.results ?? []).map((r, i) => {
    const postcode = pick(r, ["codepostal", "lieuxtravailcodepostal", "code_postal"]);
    return {
      id: `forem-${pick(r, ["numerooffreforem", "id", "reference"]) || i}`,
      title: pick(r, ["titreoffre", "intitule", "titre"]),
      company: pick(r, ["nomemployeur", "employeur", "entreprise"]),
      city: pick(r, ["lieuxtravaillocalite", "localite", "commune"]),
      postcode: postcode || undefined,
      region: regionFromPostcode(postcode) ?? "wallonie",
      contract: mapContract(pick(r, ["typecontrat", "regimetravail", "contrat"])),
      description: pick(r, ["descriptionfonction", "description", "metier"]),
      url: pick(r, ["url", "lienoffre", "urloffre"]) || "https://www.leforem.be",
      source: "Le Forem",
      publishedAt: pick(r, ["datedebutdiffusion", "datepublication"]) || new Date().toISOString(),
      language: "fr",
    } satisfies Offer;
  });
}
