import type { Lang, Offer, Profile } from "./types";

export interface MatchResult {
  score: number;
  reasons: string[];
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

/**
 * Score de correspondance simple et explicable (0 à 100).
 * Il sera complété par un score IA, mais reste la base : rapide, gratuit et transparent.
 */
export function matchOffer(offer: Offer, profile: Profile, ui: Lang): MatchResult {
  const reasons: string[] = [];
  const t = (fr: string, nl: string) => (ui === "nl" ? nl : fr);
  let score = 20;

  if (profile.contracts.includes(offer.contract)) {
    score += 30;
    reasons.push(t("Le type de contrat te correspond", "Het contracttype past bij je"));
  }
  if (offer.region && offer.region === profile.region) {
    score += 20;
    reasons.push(t("Dans ta région", "In jouw regio"));
  }

  const text = `${offer.title} ${offer.description}`.toLowerCase();
  const terms = [...profile.skills, profile.field]
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 1);
  const hits = terms.filter((s) => text.includes(s));
  if (hits.length) {
    score += Math.min(25, hits.length * 10);
    reasons.push(t(`Compétences : ${hits.join(", ")}`, `Vaardigheden: ${hits.join(", ")}`));
  }

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
    reasons.push(t("Une langue demandée te manque", "Een gevraagde taal ontbreekt"));
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}
