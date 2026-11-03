import { NextResponse } from "next/server";
import type { Lang, Offer, Profile } from "@/lib/types";

interface Body {
  offer: Offer;
  profile: Pick<Profile, "firstName" | "lastName" | "studyLevel" | "field" | "skills" | "languages">;
  lang: Lang;
}

function fallbackLetter({ offer, profile, lang }: Body): string {
  const skills = profile.skills.slice(0, 3).join(", ");
  if (lang === "nl") {
    return `Geachte heer, mevrouw,

Met veel interesse las ik uw vacature voor ${offer.title} bij ${offer.company}. Met mijn achtergrond in ${profile.field || "dit domein"} (${profile.studyLevel}) en mijn vaardigheden in ${skills || "teamwerk en communicatie"} ben ik ervan overtuigd dat ik snel kan bijdragen aan uw team.

Graag licht ik mijn motivatie toe tijdens een gesprek.

Met vriendelijke groeten,
${profile.firstName} ${profile.lastName}`;
  }
  return `Madame, Monsieur,

C'est avec un grand intérêt que j'ai découvert votre offre de ${offer.title} chez ${offer.company}. Avec mon parcours en ${profile.field || "ce domaine"} (${profile.studyLevel}) et mes compétences en ${skills || "travail d'équipe et communication"}, je suis convaincu·e de pouvoir rapidement contribuer à votre équipe.

Je serais ravi·e de vous exposer ma motivation lors d'un entretien.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.
${profile.firstName} ${profile.lastName}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ letter: fallbackLetter(body), ai: false });

  // On n'envoie à l'IA que le strict nécessaire : pas d'adresse, pas d'e-mail, pas de date de naissance.
  const language = body.lang === "nl" ? "Nederlands" : "français";
  const prompt = `Rédige une lettre de motivation courte (200 mots maximum) en ${language}, au ton naturel et sincère, adaptée au marché belge.
Offre : ${body.offer.title} chez ${body.offer.company} (${body.offer.city}).
Description : ${body.offer.description}
Candidat : ${body.profile.firstName} ${body.profile.lastName}, niveau ${body.profile.studyLevel}, domaine ${body.profile.field}, compétences ${body.profile.skills.join(", ")}, langues ${body.profile.languages.join(", ")}.
N'invente aucune expérience. Réponds uniquement avec la lettre.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return NextResponse.json({ letter: fallbackLetter(body), ai: false });
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const letter = data.content?.find((c) => c.type === "text")?.text ?? fallbackLetter(body);
  return NextResponse.json({ letter, ai: true });
}
