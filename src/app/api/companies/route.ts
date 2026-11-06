import { NextResponse } from "next/server";
import { cityLabel } from "@/lib/belgium";
import { getRegionOffers } from "@/lib/sources";
import type { Region } from "@/lib/types";

const REGIONS: Region[] = ["bruxelles", "wallonie", "flandre"];
const plain = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Entreprises qui recrutent, regroupées à partir des offres publiques. Aucun contact personnel. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const region = REGIONS.find((r) => r === params.get("region"));
  const sector = params.get("sector") ?? "";
  const city = plain(params.get("city") ?? "");
  const { offers } = await getRegionOffers(region);

  const sectors = new Map<string, number>();
  for (const o of offers) if (o.sector) sectors.set(o.sector, (sectors.get(o.sector) ?? 0) + 1);

  const kept = offers.filter(
    (o) =>
      (!sector || o.sector === sector) &&
      (!city || plain(`${o.city} ${cityLabel(o.city, "fr")} ${cityLabel(o.city, "nl")}`).includes(city)),
  );
  const groups = new Map<string, typeof kept>();
  for (const o of kept) {
    const name = o.company.trim();
    if (!name) continue;
    groups.set(name.toLowerCase(), [...(groups.get(name.toLowerCase()) ?? []), o]);
  }
  const companies = [...groups.values()]
    .sort((a, b) => b.length - a.length)
    .slice(0, 60)
    .map((list) => ({
      name: list[0].company.trim(),
      count: list.length,
      cities: [...new Set(list.map((o) => o.city).filter(Boolean))].slice(0, 3),
      sector: list[0].sector,
      region: list[0].region,
      offers: list.slice(0, 8),
    }));
  return NextResponse.json(
    {
      companies,
      total: groups.size,
      sectors: [...sectors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([s]) => s),
    },
    { headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
  );
}
