import type { Metadata } from "next";
import Link from "next/link";
import { getDict, isLang } from "@/lib/i18n";

type Params = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Une offre partagée par lien : seuls le titre, l'entreprise, la ville et le lien de l'annonce passent dans l'adresse. */
function read(q: Record<string, string | string[] | undefined>) {
  const one = (k: string) => String((Array.isArray(q[k]) ? q[k]?.[0] : q[k]) ?? "").slice(0, 200);
  const url = one("u");
  return { title: one("t"), company: one("c"), city: one("v"), source: one("s"), url: /^https:\/\//.test(url) ? url : "" };
}

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(isLang(lang) ? lang : "fr");
  const o = read(await searchParams);
  const title = o.title ? `${o.title}${o.company ? ` · ${o.company}` : ""}` : t.offers.sharedPage;
  const description = [o.city, t.offers.shareTitle].filter(Boolean).join(" · ");
  return { title, description, openGraph: { title, description, siteName: t.brand, type: "website" }, robots: { index: false } };
}

export default async function Page({ params, searchParams }: Params) {
  const { lang: raw } = await params;
  const lang = isLang(raw) ? raw : "fr";
  const t = getDict(lang);
  const o = read(await searchParams);
  return (
    <main className="page">
      <div className="panel" style={{ maxWidth: 560, margin: "0 auto", display: "grid", gap: 12 }}>
        <p className="muted small" style={{ margin: 0 }}>{t.offers.sharedPage}</p>
        <h1 style={{ margin: 0 }}>{o.title || t.offers.sharedPage}</h1>
        {(o.company || o.city) && <p className="muted" style={{ margin: 0 }}>{[o.company, o.city].filter(Boolean).join(" · ")}</p>}
        {o.source && <p className="muted small" style={{ margin: 0 }}>{t.offers.source} : {o.source}</p>}
        <div className="sheet-actions">
          {o.url && <a className="btn dark" href={o.url} target="_blank" rel="noreferrer nofollow">{t.offers.open}</a>}
          <Link className="btn brand" href={`/${lang}/offres`}>{t.offers.sharedMore}</Link>
        </div>
      </div>
    </main>
  );
}
