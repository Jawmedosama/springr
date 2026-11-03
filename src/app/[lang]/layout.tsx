import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict, isLang, LANGS } from "@/lib/i18n";
import "../globals.css";

export const metadata: Metadata = {
  title: "Springr",
  description: "Jobs, stages et alternance pour les 16 à 35 ans en Belgique.",
};

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
  const other = lang === "fr" ? "nl" : "fr";
  return (
    <html lang={lang}>
      <body>
        <header className="top">
          <Link href={`/${lang}`} className="logo">
            <span className="logo-mark" aria-hidden>↗</span> {t.brand}
          </Link>
          <nav>
            <Link href={`/${lang}/offres`}>{t.nav.offers}</Link>
            <Link href={`/${lang}/candidatures`}>{t.nav.applications}</Link>
            <Link href={`/${lang}/inscription`}>{t.nav.signup}</Link>
            <Link href={`/${other}`} className="lang">{other.toUpperCase()}</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="foot">{t.footer}</footer>
      </body>
    </html>
  );
}
