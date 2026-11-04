import { NextResponse } from "next/server";
import { askClaude, scrub } from "@/lib/ai";

/** Analyse par l'IA du métier, des études, des compétences et des langues. Les coordonnées sont retirées avant. */
export async function POST(req: Request) {
  const { text } = (await req.json()) as { text?: string };
  const prompt = `Voici le texte d'un CV. Réponds uniquement avec un objet JSON, sans commentaire :
{"field": métier recherché ou actuel en quelques mots,
 "studyLevel": 0 secondaire en cours, 1 secondaire terminé, 2 bachelier, 3 master, 4 alternance, 5 autre,
 "skills": au plus 12 compétences courtes,
 "languages": codes parmi "fr","nl","de","en"}
N'invente rien : omets une clé si l'information manque.
CV :
${scrub(text)}`;
  const answer = await askClaude(prompt, 500);
  const json = answer?.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return NextResponse.json({ ai: false });
  try {
    return NextResponse.json({ ai: true, fields: JSON.parse(json) as unknown });
  } catch {
    return NextResponse.json({ ai: false });
  }
}
