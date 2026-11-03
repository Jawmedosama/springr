import { NextResponse } from "next/server";
import { askClaude, scrub } from "@/lib/ai";
import type { AiProfile, Lang, Offer } from "@/lib/types";

interface Body {
  offer: Offer;
  profile: AiProfile;
  lang: Lang;
  /** Candidature spontanée : l'entreprise n'a pas forcément d'offre ouverte. */
  spontaneous?: boolean;
}

function fallbackLetter({ offer, profile, lang, spontaneous }: Body): string {
  const skills = profile.skills.slice(0, 3).join(", ");
  if (lang === "nl") {
    const intro = spontaneous
      ? `Graag stel ik mij spontaan kandidaat bij ${offer.company}.`
      : `Met veel interesse las ik uw vacature voor ${offer.title} bij ${offer.company}.`;
    return `Geachte heer, mevrouw,

${intro} Mijn opleidingsniveau: ${profile.studyLevel}. Ik wil graag mijn sterke punten (${skills || "teamwerk en communicatie"}) inzetten en snel bijdragen aan uw team.

Graag licht ik mijn motivatie toe tijdens een gesprek.

Met vriendelijke groeten,
${profile.firstName} ${profile.lastName}`;
  }
  const intro = spontaneous
    ? `Je me permets de vous adresser ma candidature spontanée au sein de ${offer.company}.`
    : `C'est avec un grand intérêt que j'ai découvert votre offre de ${offer.title} chez ${offer.company}.`;
  return `Madame, Monsieur,

${intro} Mon niveau d'études : ${profile.studyLevel}. Je souhaite mettre à votre service mes points forts (${skills || "travail d'équipe et communication"}) et contribuer rapidement à votre équipe.

Je serais ravi·e de vous exposer ma motivation lors d'un entretien.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.
${profile.firstName} ${profile.lastName}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  // On n'envoie à l'IA que le strict nécessaire : pas d'adresse, pas d'e-mail, pas de date de naissance.
  const { offer, profile } = body;
  const language = body.lang === "nl" ? "Nederlands" : "français";
  const target = body.spontaneous
    ? `Candidature spontanée chez ${offer.company} (${offer.city}), pour un poste lié à : ${offer.title}.`
    : `Offre : ${offer.title} chez ${offer.company} (${offer.city}).\nDescription : ${offer.description.slice(0, 1500)}`;
  const prompt = `Rédige une lettre de motivation courte (200 mots maximum) en ${language}, au ton naturel et sincère, adaptée au marché belge.
${target}
Candidat : ${profile.firstName}, niveau ${profile.studyLevel}, domaine ${profile.field}, compétences ${profile.skills.join(", ")}, langues ${profile.languages.join(", ")}.
${profile.cvText ? `Extrait du CV :\n${scrub(profile.cvText)}\n` : ""}N'invente aucune expérience. Termine par « ${profile.firstName} ${profile.lastName} ». Réponds uniquement avec la lettre.`;

  const letter = await askClaude(prompt, 800);
  return NextResponse.json({ letter: letter ?? fallbackLetter(body), ai: Boolean(letter) });
}
