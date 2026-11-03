"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dict } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { Lang } from "@/lib/types";
import { IconBuilding, IconCards, IconList, IconMenu, IconUser } from "./Icons";

export function Logo({ lang, brand }: { lang: Lang; brand: string }) {
  return (
    <Link href={`/${lang}`} className="logo">
      <span className="logo-mark" aria-hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 19c3-1 4-4 4-7s2-6 6-6M15 6l-3-3M15 6l-3 3" />
        </svg>
      </span>
      {brand}
    </Link>
  );
}

export default function Header({ lang, t }: { lang: Lang; t: Dict }) {
  const path = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  useEffect(() => setHasProfile(Boolean(store.getProfile())), [path]);
  const other = lang === "fr" ? "nl" : "fr";
  const switchTo = path.replace(/^\/(fr|nl)/, `/${other}`) || `/${other}`;
  const isHome = path === `/${lang}`;
  const app = [
    { href: `/${lang}/offres`, label: t.nav.offers, Icon: IconCards },
    { href: `/${lang}/entreprises`, label: t.nav.companies, Icon: IconBuilding },
    { href: `/${lang}/candidatures`, label: t.nav.applications, Icon: IconList },
    { href: `/${lang}/profil`, label: t.nav.profile, Icon: IconUser },
  ];
  const links = isHome
    ? [
        { href: `/${lang}#fonctions`, label: t.nav.features },
        { href: `/${lang}#tarifs`, label: t.nav.pricing },
        { href: `/${lang}#faq`, label: t.nav.faq },
        { href: `/${lang}/offres`, label: t.nav.offers },
      ]
    : app;

  const cta = hasProfile
    ? { href: `/${lang}/offres`, label: t.nav.offers }
    : { href: `/${lang}/inscription`, label: t.nav.start };

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <Logo lang={lang} brand={t.brand} />
          <nav className="top-nav">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={path.startsWith(l.href) && !l.href.includes("#") ? "on" : ""}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="top-right">
            <Link href={switchTo} className="lang-switch" hrefLang={other}>{other.toUpperCase()}</Link>
            <Link href={cta.href} className="btn dark small">{cta.label}</Link>
            <button className="burger" aria-label={t.nav.menu} aria-expanded={open} onClick={() => setOpen(!open)}>
              <IconMenu className="" />
            </button>
          </div>
        </div>
        <nav className={open ? "mobile-menu open" : "mobile-menu"} onClick={() => setOpen(false)}>
          {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
          <Link href={cta.href} className="btn dark">{cta.label}</Link>
        </nav>
      </header>
      {!isHome && (
        <nav className="tabbar" aria-label={t.nav.menu}>
          {app.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={path.startsWith(href) ? "on" : ""}>
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
