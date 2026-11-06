import { NextResponse } from "next/server";

/** Seulement les sites d'où viennent nos offres : ce n'est pas un relais ouvert. */
const HOSTS = ["leforem.be", "adzuna.be", "adzuna.com", "greenhouse.io", "lever.co", "recruitee.com", "smartrecruiters.com"];

/** Une offre est signalée seulement si le site répond clairement qu'elle n'existe plus. */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url") ?? "";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return NextResponse.json({ gone: false });
  }
  if (url.protocol !== "https:" || !HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
    return NextResponse.json({ gone: false });
  }
  const res = await fetch(url, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(4000) }).catch(() => null);
  return NextResponse.json({ gone: res?.status === 404 || res?.status === 410 });
}
