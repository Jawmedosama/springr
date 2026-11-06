import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import AuthSync from "@/components/AuthSync";
import ClientErrors from "@/components/ClientErrors";
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
    appleWebApp: { capable: true, title: t.brand, statusBarStyle: "black-translucent" },
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
        <AuthSync />
        <ClientErrors />
        <Header lang={lang} t={t} />
        {children}
        <footer className="foot">
          <div className="wrap foot-in">
            <div style={{ maxWidth: 340 }}>
              <Logo lang={lang} brand={t.brand} />
              <p style={{ marginTop: 12 }}>{t.footer.tagline}</p>
              <p className="small">{t.footer.note}</p>
              <p className="small">
                <a href="https://www.odwb.be/explore/dataset/offres-d-emploi-forem/" target="_blank" rel="noreferrer">{t.footer.sources}</a>
              </p>
            </div>
            <div className="foot-cols">
              <div>
                <b>{t.footer.product}</b>
                <Link href={`/${lang}/offres`}>{t.nav.offers}</Link>
                <Link href={`/${lang}/entreprises`}>{t.nav.companies}</Link>
                <Link href={`/${lang}/candidatures`}>{t.nav.applications}</Link>
              </div>
              <div>
                <b>{t.footer.legal}</b>
                <Link href={`/${lang}/legal/mentions`}>{t.footer.mentions}</Link>
                <Link href={`/${lang}/legal/confidentialite`}>{t.footer.privacy}</Link>
                <Link href={`/${lang}/legal/conditions`}>{t.footer.terms}</Link>
                <Link href={`/${lang}/legal/cookies`}>{t.footer.cookies}</Link>
              </div>
              <div>
                <b>{t.footer.help}</b>
                <Link href={`/${lang}/guides/job-etudiant`}>{t.footer.guideStudent}</Link>
                <Link href={`/${lang}/guides/flexi-job`}>Flexi-job</Link>
                <Link href={`/${lang}/guides/cv-belgique`}>{t.footer.guideCv}</Link>
                <Link href={`/${lang}/extension`}>{t.footer.extension}</Link>
                <Link href={`/${lang}/entreprises/publier`}>{t.footer.employers}</Link>
                <Link href={`/${lang}/avis`}>{t.feedback.title}</Link>
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
