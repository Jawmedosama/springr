import { NextResponse } from "next/server";
import { getAllOffers, getRegionOffers } from "@/lib/sources";
import type { ContractType, Region } from "@/lib/types";

const REGIONS: Region[] = ["bruxelles", "wallonie", "flandre"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const get = (k: string) => (searchParams.get(k) ?? "").slice(0, 80);
  const result =
    get("scope") === "companies"
      ? await getRegionOffers(REGIONS.find((r) => r === get("region")))
      : await getAllOffers({ what: get("what"), where: get("where"), km: Number(get("km")) || undefined, contracts: get("contracts").split(",").filter(Boolean) as ContractType[], region: REGIONS.find((r) => r === get("region")) });
  return NextResponse.json(result, {
    headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
