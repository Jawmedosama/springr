import { NextResponse } from "next/server";
import { getAllOffers } from "@/lib/sources";

export const revalidate = 3600;

export async function GET() {
  const { offers, demo } = await getAllOffers();
  return NextResponse.json({ offers, demo });
}
