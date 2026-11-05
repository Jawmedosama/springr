import { NextResponse } from "next/server";
import { getFeed, type FeedRequest } from "@/lib/sources/feed";

export async function POST(req: Request) {
  const body = (await req.json()) as FeedRequest;
  return NextResponse.json(await getFeed({ ...body, page: Math.max(0, Number(body.page) || 0) }));
}
