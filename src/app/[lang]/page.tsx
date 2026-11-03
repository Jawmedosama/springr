import Link from "next/link";
import { getDict, isLang } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const t = getDict(isLang(lang) ? lang : "fr").home;
  return (
    <>
      <section className="hero">
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
        <div className="row">
          <Link className="btn primary" href={`/${lang}/inscription`}>{t.cta}</Link>
          <Link className="btn" href={`/${lang}/offres`}>{t.secondary}</Link>
        </div>
      </section>
      <section className="features">
        {[[t.f1t, t.f1d], [t.f2t, t.f2d], [t.f3t, t.f3d]].map(([h, d]) => (
          <div className="card" key={h}>
            <h3>{h}</h3>
            <p>{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
