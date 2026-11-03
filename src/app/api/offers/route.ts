import { NextResponse } from "next/server";
import { getAllOffers } from "@/lib/sources";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const what = (searchParams.get("what") ?? "").slice(0, 80);
  const where = (searchParams.get("where") ?? "").slice(0, 80);
  const result = await getAllOffers({ what, where });
  return NextResponse.json(result, {
    headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
