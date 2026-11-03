import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const accept = req.headers.get("accept-language") ?? "";
  const lang = /^nl|,\s*nl/i.test(accept) && !/^fr/i.test(accept) ? "nl" : "fr";
  return NextResponse.redirect(new URL(`/${lang}`, req.url));
}

export const config = { matcher: ["/"] };
