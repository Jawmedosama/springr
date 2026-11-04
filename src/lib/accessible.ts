import type { Offer, Profile } from "./types";

const FOR_BEGINNERS =
  /(débutant|debutant|sans expérience|sans experience|pas d'expérience|première expérience|premier emploi|junior|starter|geen ervaring|zonder ervaring|beginner|étudiant|etudiant|student|temps partiel|deeltijds|mi-temps|flexi|polyvalent|formation assurée|opleiding voorzien)/i;
const SENIOR_TITLE =
  /\b(senior|manager|lead|directeur|directrice|director|head of|expert\w*|ingénieur\w*|engineer|architect\w*|chef de|responsable|consultant\w*|analyst\w*|médecin|avocat\w*|pharmacien\w*)\b/i;
const NEEDS_DEGREE = /(bachelier|master|diplôme requis|diplômé|gediplomeerd|\bans d'expérience|jaar ervaring|years of experience)/i;

export function isAccessible(o: Offer): boolean {
  if (SENIOR_TITLE.test(o.title)) return false;
  if (["etudiant", "stage", "alternance"].includes(o.contract)) return true;
  return FOR_BEGINNERS.test(`${o.title} ${o.description}`) || !NEEDS_DEGREE.test(o.description);
}

/** Vrai quand l'annonce dit clairement qu'elle s'adresse aux débutants. */
export function welcomesBeginners(o: Offer): boolean {
  return !SENIOR_TITLE.test(o.title) && (o.contract === "etudiant" || FOR_BEGINNERS.test(`${o.title} ${o.description}`));
}

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
