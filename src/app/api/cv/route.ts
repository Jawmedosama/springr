import { NextResponse } from "next/server";
import { askClaude, scrub } from "@/lib/ai";
import type { AiProfile, Lang, Offer } from "@/lib/types";

interface Body {
  offer: Offer;
  profile: AiProfile;
  lang: Lang;
}

/** CV de base, sans IA : on remet les éléments du profil dans l'ordre utile pour l'offre. */
function fallbackCv({ offer, profile, lang }: Body): string {
  const nl = lang === "nl";
  const text = `${offer.title} ${offer.description}`.toLowerCase();
  const skills = [...profile.skills].sort(
    (a, b) => Number(text.includes(b.toLowerCase())) - Number(text.includes(a.toLowerCase())),
  );
  return [
    `${profile.firstName} ${profile.lastName}`,
    nl ? `Kandidaat voor : ${offer.title}, ${offer.company}` : `Candidature : ${offer.title}, ${offer.company}`,
    "",
    nl ? "PROFIEL" : "PROFIL",
    ...(profile.field ? [nl ? `Gezocht beroep: ${profile.field}` : `Poste recherché : ${profile.field}`] : []),
    nl ? `Opleidingsniveau: ${profile.studyLevel}` : `Niveau d'études : ${profile.studyLevel}`,
    "",
    nl ? "VAARDIGHEDEN" : "COMPÉTENCES",
    ...skills.map((s) => `• ${s}`),
    "",
    nl ? "TALEN" : "LANGUES",
    profile.languages.join(", "),
    ...(profile.cvText ? ["", nl ? "ERVARING EN OPLEIDING" : "EXPÉRIENCES ET FORMATION", profile.cvText.trim()] : []),
  ].join("\n");
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const { offer, profile } = body;
  const language = body.lang === "nl" ? "Nederlands" : "français";
  // Pas d'adresse, d'e-mail ni de date de naissance : le CV est réorienté, l'utilisateur ajoute ses coordonnées.
  const prompt = `Réoriente ce CV pour l'offre ci-dessous, en ${language}, au format texte simple compatible ATS (titres en majuscules, puces « • », pas de tableau).
Offre : ${offer.title} chez ${offer.company}. ${offer.description.slice(0, 1200)}
Candidat : ${profile.firstName} ${profile.lastName}, niveau ${profile.studyLevel}, domaine ${profile.field}, compétences ${profile.skills.join(", ")}, langues ${profile.languages.join(", ")}.
CV actuel :
${scrub(profile.cvText) || "(pas de CV fourni : construis-le uniquement à partir des éléments ci-dessus)"}
Mets en avant ce qui correspond à l'offre et reprends les mots-clés de l'annonce quand ils sont vrais pour le candidat. N'invente aucune expérience, aucun diplôme, aucune date. Ne mets pas de coordonnées. Réponds uniquement avec le CV.`;

  const cv = await askClaude(prompt, 1400);
  return NextResponse.json({ cv: cv ?? fallbackCv(body), ai: Boolean(cv) });
}
