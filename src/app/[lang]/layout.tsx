import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Header, { Logo } from "@/components/Header";
import { getDict, isLang, LANGS } from "@/lib/i18n";
import "../globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-bricolage" });
const body = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = getDict(isLang(lang) ? lang : "fr");
  return {
    title: `${t.brand} · ${t.home.title1} ${t.home.title2}`,
    description: t.home.lead,
  };
}

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  return (
    <html lang={lang} className={`${display.variable} ${body.variable}`}>
      <body>
        <Header lang={lang} t={t} />
        {children}
        <footer className="foot">
          <div className="wrap foot-in">
            <div style={{ maxWidth: 340 }}>
              <Logo lang={lang} brand={t.brand} />
              <p style={{ marginTop: 12 }}>{t.footer.tagline}</p>
              <p className="small">{t.footer.note}</p>
            </div>
            <div className="foot-cols">
              <div>
                <b>{t.footer.product}</b>
                <Link href={`/${lang}/offres`}>{t.nav.offers}</Link>
                <Link href={`/${lang}/entreprises`}>{t.nav.companies}</Link>
                <Link href={`/${lang}/candidatures`}>{t.nav.applications}</Link>
              </div>
              <div>
                <b>{t.footer.help}</b>
                <Link href={`/${lang}#faq`}>{t.nav.faq}</Link>
                <Link href={`/${lang}#tarifs`}>{t.nav.pricing}</Link>
                <Link href={`/${lang}/profil`}>{t.nav.profile}</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
