import { NextResponse } from "next/server";
import { getAllOffers } from "@/lib/sources";

/** Chiffres de la page d'accueil. Le réseau de Vercel les garde une heure. */
export async function GET() {
  const { offers, agencies, demo } = await getAllOffers({ all: true });
  const byCompany = new Map<string, number>();
  for (const o of offers) {
    if (o.company && !/anonyme/i.test(o.company)) byCompany.set(o.company, (byCompany.get(o.company) ?? 0) + 1);
  }
  const top = [...byCompany].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name]) => name);
  return NextResponse.json(
    { total: offers.length + agencies.length, direct: offers.length, top, demo },
    { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
