import { NextResponse } from "next/server";
import { scrub } from "@/lib/ai";

/** Écrit l'avis dans les journaux du site, sans coordonnées. */
export async function POST(req: Request) {
  const { text = "", lang } = (await req.json().catch(() => ({}))) as { text?: string; lang?: string };
  if (text.trim()) console.info(`[avis ${lang === "nl" ? "nl" : "fr"}] ${scrub(text).slice(0, 1500)}`);
  return NextResponse.json({ ok: true });
}
