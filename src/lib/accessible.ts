import type { Offer, Profile } from "./types";

const FOR_BEGINNERS =
  /(débutant|debutant|sans expérience|sans experience|pas d'expérience|première expérience|premier emploi|junior|starter|geen ervaring|zonder ervaring|beginner|étudiant|etudiant|student|flexi|polyvalent|formation assurée|opleiding voorzien)/i;
/** Métiers qui recrutent souvent sans diplôme particulier. */
const ENTRY_JOBS =
  /(vendeu|verkoper|verkoopster|caissi|kassier|magasinier|magazijn|manutention|serveu|plongeu|commis|nettoyage|schoonmaak|livreu|chauffeur-livreur|accueil|réassort|équipier|equipier|préparateur de commandes|orderpicker|logistiek medewerker|aide-)/i;
/** Titres qui demandent de l'expérience, un diplôme ou un titre protégé. */
const NOT_ENTRY =
  /\b(senior|expérimenté\w*|ervaren|manager|lead|directeur|directrice|director|head of|expert\w*|ingénieur\w*|engineer|architect\w*|chef|responsable|consultant\w*|analyst\w*|médecin|arts|avocat\w*|pharmacien\w*|infirmi\w*|verpleeg\w*|sage-femme|kin[eé]\w*|psycho\w*|comptable|boekhoud\w*|technicien\w*|électricien\w*|electricien\w*|mécanicien\w*)\b/i;

/** Estimation par mots-clés : les annonces n'indiquent presque jamais le niveau requis. */
export function isAccessible(o: Offer): boolean {
  if (NOT_ENTRY.test(o.title) && !/\b(junior|étudiant|etudiant|student)\b/i.test(o.title)) return false;
  return ["etudiant", "stage", "alternance"].includes(o.contract) || FOR_BEGINNERS.test(`${o.title} ${o.description}`) || ENTRY_JOBS.test(o.title);
}

/** Vrai quand l'annonce s'adresse clairement aux débutants. */
export const welcomesBeginners = isAccessible;

export function hasLittleExperience(p: Profile): boolean {
  return (p.cvText ?? "").length < 400;
}

/** Adresse e-mail publiée dans l'annonce elle-même : on n'en cherche jamais ailleurs. */
export function emailInOffer(o: Offer): string | null {
  return o.description.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)?.[0] ?? null;
}

export function mailtoLink(o: Offer, letter: string, subject: string): string {
  const to = emailInOffer(o);
  return to ? `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(letter)}` : "";
}

/** Ouvre le document dans une fenêtre d'impression : « Enregistrer en PDF » donne un fichier propre. */
export function printAsPdf(title: string, text: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.title = title;
  const style = w.document.createElement("style");
  style.textContent =
    "@page{margin:18mm}body{font:11pt/1.5 Georgia,'Times New Roman',serif;color:#111;white-space:pre-wrap;max-width:170mm;margin:0 auto}";
  w.document.head.appendChild(style);
  w.document.body.textContent = text;
  w.focus();
  w.print();
}
