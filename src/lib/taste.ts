import type { Offer } from "./types";

/** Familles de métiers, en français, néerlandais et anglais. */
export const FAMILIES: Record<string, RegExp> = {
  vente: /\b(vendeu|vendeur|conseill\w* (de )?vente|caissi|commerci|magasin\w* (de )?vente|retail|verko|kassa|kassier|winkel|sales|store (assistant|manager)|account manager|équipier de vente)/i,
  logistique: /\b(magasinier|logisti|manutention|cariste|orderpick|magazijn|heftruck|préparat\w* de commandes|warehouse|réassort|supply chain|expédition|reachtruck)/i,
  horeca: /\b(horeca|serveu|barman|barmaid|kelner|commis|cuisin|chef de partie|kok\b|plongeu|afwas|restauration|restaurant|hôtel|hotel|réception\w* d'hôtel|barista|traiteur|boulang|bakker|pâtissi)/i,
  nettoyage: /\b(nettoy|entretien ménager|technicien\w* de surface|aide[- ]ménag|schoonma|poets|cleaner|housekeep|titres[- ]services|dienstencheque)/i,
  construction: /\b(maçon|metser|bâtiment|chantier|carreleu|plafonneu|couvreu|menuisi|schrijnwerker|charpent|peintre|schilder|bouw|ouvrier\w* de la construction|grutier|terrassi|dakwerker|plaquiste)/i,
  technique: /\b(électric|elektric|électromécan|mécanicien|mecanicien|technicien|technieker|soudeu|lasser|tuyauteu|chauffagist|plombier|loodgiet|maintenance|onderhoud|hvac|frigorist|operator|opérateur|productie|production)/i,
  transport: /\b(chauffeu|conducteu|livreu|coursier|bestuurder|vrachtwagen|camion|transport|koerier|buschauffeur|driver)/i,
  soins: /\b(infirmi|aide[- ]soignant|soignant|verpleeg|zorgkundig|zorg\b|kinésith|kinesi|médecin|arts\b|pharmaci|apothek|ergothérap|logopéd|psycholog|éducateur|opvoeder|aide familial|gezinshulp|nurse|care\b)/i,
  enfance: /\b(puéricult|accueillant\w* d'enfants|crèche|kinderverzorg|kinderopvang|instituteur|enseignant|leerkracht|leraar|professeur|teacher|animat\w*)/i,
  bureau: /\b(secrétaire|secretaresse|assistant\w* administrati|administrati|employé\w* de bureau|bediende|receptionist|réceptionniste|accueil|onthaal|office|call center|service clients?|klantendienst|customer (service|support)|helpdesk)/i,
  finance: /\b(comptab|boekhoud|accountan|fiscal|finance|financ|audit|payroll|paie\b|loonadmin|controller|credit|assurance|verzeker|bank)/i,
  informatique: /\b(développeu|developer|ontwikkelaar|software|informatic|informati|devops|data |cloud|cyber|réseau|netwerk|system admin|programmeu|programmeur|fullstack|front[- ]?end|back[- ]?end|\bit\b|\bict\b)/i,
  marketing: /\b(marketing|communication|communicatie|community manager|graphis|grafisch|webdesign|content|social media|seo\b)/i,
  rh: /\b(ressources humaines|\brh\b|\bhr\b|recruteu|recruiter|talent)/i,
};

export function familyOf(text: string): string | undefined {
  return Object.keys(FAMILIES).find((k) => FAMILIES[k].test(text));
}

export const offerFamily = (o: Offer) => familyOf(o.title) ?? (o.sector ? familyOf(o.sector) : undefined);

/** Préférences apprises sur les swipes : seulement des compteurs, gardés dans le navigateur. */
export interface Taste {
  families: Record<string, number>;
  sectors: Record<string, number>;
  companies: Record<string, number>;
}

export const NO_TASTE: Taste = { families: {}, sectors: {}, companies: {} };

const LIMIT = 5;
const clamp = (n: number) => Math.max(-LIMIT, Math.min(LIMIT, n));
const key = (s: string) => s.trim().toLowerCase();

/** Garde les préférences les plus marquées : la liste reste courte. */
function trim(m: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(m)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 30),
  );
}

export function learn(t: Taste, o: Offer, keep: boolean): Taste {
  const step = keep ? 1 : -1;
  const add = (m: Record<string, number>, k?: string) => (k ? trim({ ...m, [key(k)]: clamp((m[key(k)] ?? 0) + step) }) : m);
  return { families: add(t.families, offerFamily(o)), sectors: add(t.sectors, o.sector), companies: add(t.companies, o.company) };
}

/** Points ajoutés ou retirés au score, jamais plus de 15 dans un sens. */
export function tasteBoost(o: Offer, t?: Taste | null): number {
  if (!t) return 0;
  const family = offerFamily(o);
  const raw = (family ? clamp(t.families?.[family] ?? 0) * 2 : 0) + (o.sector ? clamp(t.sectors?.[key(o.sector)] ?? 0) : 0) + clamp(t.companies?.[key(o.company)] ?? 0) * 2;
  return Math.max(-15, Math.min(15, raw));
}
