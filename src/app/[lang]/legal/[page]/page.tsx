import { notFound } from "next/navigation";
import { getDict, isLang, LANGS } from "@/lib/i18n";
import { LEGAL, LEGAL_SLUGS, type LegalSlug } from "@/lib/legal";

export function generateStaticParams() {
  return LANGS.flatMap((lang) => LEGAL_SLUGS.map((page) => ({ lang, page })));
}

export default async function Page({ params }: { params: Promise<{ lang: string; page: string }> }) {
  const { lang: raw, page } = await params;
  const lang = isLang(raw) ? raw : "fr";
  if (!LEGAL_SLUGS.includes(page as LegalSlug)) notFound();
  const doc = LEGAL[lang][page as LegalSlug];
  return (
    <main className="page">
      <div className="page-head"><h1>{doc.title}</h1></div>
      <div className="form">
        {doc.sections.map(([title, lines]) => (
          <section className="panel" key={title}>
            <h3>{title}</h3>
            {lines.map((l) => <p key={l} style={{ margin: 0 }}>{l}</p>)}
          </section>
        ))}
      </div>
      <p className="muted small" style={{ marginTop: 16 }}>{getDict(lang).brand}</p>
    </main>
  );
}
