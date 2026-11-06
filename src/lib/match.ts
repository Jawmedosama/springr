import { hasLittleExperience, welcomesBeginners } from "./accessible";
import { familyOf, offerFamily, tasteBoost, type Taste } from "./taste";
import type { Lang, MatchProfile, Offer } from "./types";

export interface MatchResult {
  score: number;
  reasons: string[];
  /** Points d'attention : langue manquante, offre ancienne. */
  warnings: string[];
}

const LANG_KEYWORDS: Record<string, string[]> = {
  fr: ["français", "frans", "french"],
  nl: ["néerlandais", "nederlands", "dutch"],
  de: ["allemand", "duits", "german"],
  en: ["anglais", "engels", "english"],
};

const PROFILE_LANG_CODE: Record<string, string> = {
  Français: "fr", Frans: "fr",
  Néerlandais: "nl", Nederlands: "nl",
  Allemand: "de", Duits: "de",
  Anglais: "en", Engels: "en",
};

const FAMILY_NAMES: Record<string, [string, string]> = {
  vente: ["vente", "verkoop"],
  logistique: ["logistique", "logistiek"],
  horeca: ["horeca", "horeca"],
  nettoyage: ["nettoyage", "schoonmaak"],
  construction: ["construction", "bouw"],
  technique: ["technique", "techniek"],
  transport: ["transport", "transport"],
  soins: ["soins", "zorg"],
  enfance: ["enfance et enseignement", "kinderen en onderwijs"],
  bureau: ["bureau et accueil", "kantoor en onthaal"],
  finance: ["finance", "financiën"],
  informatique: ["informatique", "IT"],
  marketing: ["marketing", "marketing"],
  rh: ["ressources humaines", "HR"],
};

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** Racine d'un mot : vendeur, vendeuse et vendeurs comptent pour le même mot. */
function stem(word: string): string {
  const cut = word.replace(/(trices?|teurs?|euses?|eurs?|rices?|sters?|aars?|ers?|es|en|s|e)$/, "");
  return cut.length >= 4 ? cut : word;
}

const stems = (text: string) => new Set(fold(text).split(/[^a-z0-9+#]+/).filter((w) => w.length > 2).map(stem));

/** Tous les mots utiles de la compétence se trouvent dans le texte. */
function found(term: string, words: Set<string>): boolean {
  const parts = [...stems(term)];
  return parts.length > 0 && parts.every((p) => words.has(p));
}

/**
 * Score de correspondance simple et explicable (0 à 100).
 * Il sera complété par un score IA, mais reste la base : rapide, gratuit et transparent.
 */
export function matchOffer(offer: Offer, profile: MatchProfile, ui: Lang, taste?: Taste | null): MatchResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const t = (fr: string, nl: string) => (ui === "nl" ? nl : fr);
  let score = 15;

  if (profile.contracts.includes(offer.contract)) {
    score += 20;
    reasons.push(t("Le type de contrat te correspond", "Het contracttype past bij je"));
  } else if (offer.contract === "nc") {
    score += 5;
  }
  if (offer.region && offer.region === profile.region) {
    score += 10;
    reasons.push(t("Dans ta région", "In jouw regio"));
  }

  const text = `${offer.title} ${offer.description}`.toLowerCase();
  const terms = [...profile.skills, profile.field]
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 1);
  // Un mot dans le titre compte bien plus qu'un mot dans la description.
  const titleWords = stems(offer.title);
  const bodyWords = stems(offer.description);
  const inTitle = terms.filter((s) => found(s, titleWords));
  const inBody = terms.filter((s) => !inTitle.includes(s) && found(s, bodyWords));
  const hits = [...inTitle, ...inBody];
  if (hits.length) {
    score += Math.min(30, inTitle.length * 15 + inBody.length * 5);
    reasons.push(t(`Compétences : ${hits.join(", ")}`, `Vaardigheden: ${hits.join(", ")}`));
  }

  const family = offerFamily(offer);
  const wanted = familyOf(profile.field) ?? familyOf(profile.skills.join(" "));
  if (family && family === wanted) {
    score += 15;
    const [fr, nl] = FAMILY_NAMES[family];
    reasons.push(t(`Même famille de métiers : ${fr}`, `Zelfde beroepsgroep: ${nl}`));
  }

  const boost = tasteBoost(offer, taste);
  score += boost;
  if (boost >= 5) reasons.push(t("Proche des offres que tu gardes", "Lijkt op vacatures die je bewaart"));
  if (boost <= -5) warnings.push(t("Tu écartes souvent ce type d'offre", "Dit type vacature sla je vaak over"));

  const spoken = new Set(profile.languages.map((l) => PROFILE_LANG_CODE[l]).filter(Boolean));
  const required = Object.entries(LANG_KEYWORDS)
    .filter(([, kws]) => kws.some((k) => text.includes(k)))
    .map(([code]) => code);
  if (offer.language) required.push(offer.language);
  const missing = [...new Set(required)].filter((c) => !spoken.has(c));
  if (missing.length === 0) {
    score += 5;
  } else {
    score -= 15 * missing.length;
    warnings.push(t("Une langue demandée te manque", "Een gevraagde taal ontbreekt"));
  }

  if (hasLittleExperience(profile) && welcomesBeginners(offer)) {
    score += 5;
    reasons.push(t("Accessible aux débutants", "Toegankelijk voor beginners"));
  }

  const days = Math.floor((Date.now() - new Date(offer.publishedAt).getTime()) / 86400000);
  if (days > 30) {
    score -= 15;
    warnings.push(t(`Offre publiée il y a ${days} jours : elle est peut-être pourvue`, `Vacature van ${days} dagen geleden: mogelijk al ingevuld`));
  } else if (days > 14) {
    score -= 5;
  } else if (days <= 3) {
    score += 5;
    reasons.push(t("Offre toute récente", "Gloednieuwe vacature"));
  }

  return { score: Math.max(0, Math.min(100, score)), reasons, warnings };
}
