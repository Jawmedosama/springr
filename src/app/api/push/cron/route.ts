import { NextResponse } from "next/server";
import webpush from "web-push";
import { getDict } from "@/lib/i18n";
import { getFeed, type FeedRequest } from "@/lib/sources/feed";
import { NO_FILTERS } from "@/lib/filters";
import type { Lang } from "@/lib/types";

export const maxDuration = 60;

interface Sub { endpoint: string; p256dh: string; auth: string; lang: Lang; query: Partial<FeedRequest>; since: string }

/** Une fois par jour (Vercel Cron) : compte les nouvelles offres de chaque abonné et le prévient. */
export async function GET(req: Request) {
  const secret = process.env.PUSH_SECRET;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!secret || !pub || !priv || !url || !anon) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const given = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? new URL(req.url).searchParams.get("key");
  if (given !== secret && given !== process.env.CRON_SECRET) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  webpush.setVapidDetails("https://springr-two.vercel.app", pub, priv);
  const rpc = (fn: string, args: object) =>
    fetch(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: anon, authorization: `Bearer ${anon}`, "content-type": "application/json" }, body: JSON.stringify(args) });

  const subs = (await (await rpc("push_list", { p_secret: secret })).json().catch(() => [])) as Sub[];
  let sent = 0;
  for (const s of Array.isArray(subs) ? subs : []) {
    const lang: Lang = s.lang === "nl" ? "nl" : "fr";
    const q = s.query ?? {};
    const feed = await getFeed({ ...q, filters: { ...NO_FILTERS, ...(q.filters ?? {}) }, lang, since: s.since, size: 1 }).catch(() => null);
    const n = feed?.newCount ?? 0;
    if (!n) continue;
    const body = getDict(lang).offers.notifyNew.replace("{n}", String(n));
    let gone = false;
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: "Ça va jobber", body, url: `/${lang}/offres` }), { TTL: 86400 });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      gone = code === 404 || code === 410;
      if (!gone) continue;
    }
    await rpc("push_mark", { p_secret: secret, p_endpoint: s.endpoint, p_gone: gone });
  }
  return NextResponse.json({ subscribers: Array.isArray(subs) ? subs.length : 0, sent });
}
