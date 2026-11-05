import { NextResponse } from "next/server";
import { getRegionOffers } from "@/lib/sources";
import type { Region } from "@/lib/types";

const REGIONS: Region[] = ["bruxelles", "wallonie", "flandre"];

/** Offres d'une région, pour la page Entreprises. */
export async function GET(req: Request) {
  const region = new URL(req.url).searchParams.get("region");
  return NextResponse.json(await getRegionOffers(REGIONS.find((r) => r === region)), {
    headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
