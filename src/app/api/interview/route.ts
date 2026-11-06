import { NextResponse } from "next/server";
import { askClaude, scrub } from "@/lib/ai";

/** Indique si la préparation d'entretien est disponible, pour cacher le bouton sinon. */
export function GET() {
  return NextResponse.json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) });
}

/** Seule l'annonce part chez l'IA : rien du profil ni du CV. */
export async function POST(req: Request) {
  const { title = "", company = "", description = "", lang } = (await req.json()) as {
    title?: string;
    company?: string;
    description?: string;
    lang?: string;
  };
  const language = lang === "nl" ? "néerlandais" : "français";
  const answer = await askClaude(
    `Prépare un candidat à un entretien d'embauche en Belgique pour cette annonce.
Réponds en ${language}, en texte simple, sans markdown : 5 questions probables, chacune suivie d'un conseil court pour y répondre.
N'invente aucune information sur l'entreprise.
Poste : ${title.slice(0, 200)}
Entreprise : ${company.slice(0, 200)}
Annonce :
${scrub(description).slice(0, 3000)}`,
    900,
  );
  return answer ? NextResponse.json({ text: answer }) : NextResponse.json({ error: true }, { status: 503 });
}
