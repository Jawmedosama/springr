"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cityLabel } from "@/lib/belgium";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { Lang, Offer, Profile, Region } from "@/lib/types";
import { initials } from "./OfferCard";
import PrepSheet from "./PrepSheet";

interface Company {
  name: string;
  offers: Offer[];
  cities: string[];
  region?: Region;
}

const REGIONS: Region[] = ["bruxelles", "wallonie", "flandre"];

/** Regroupe les offres par entreprise : celles qui publient le plus recrutent activement. */
function groupByCompany(offers: Offer[]): Company[] {
  const map = new Map<string, Company>();
  for (const o of offers) {
    const name = o.company.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const c = map.get(key) ?? { name, offers: [], cities: [], region: o.region };
    c.offers.push(o);
    if (o.city && !c.cities.includes(o.city)) c.cities.push(o.city);
    map.set(key, c);
  }
  return [...map.values()].sort((a, b) => b.offers.length - a.offers.length);
}

export default function CompanyList({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const c = t.companies;
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [region, setRegion] = useState<Region | "all" | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [prep, setPrep] = useState<Offer | null>(null);

  useEffect(() => {
    const p = store.getProfile();
    setProfile(p);
    setRegion(p?.region ?? "all");
  }, []);

  // Recherche large (toute la région, sans métier) pour voir qui recrute vraiment.
  useEffect(() => {
    if (region === null) return;
    setOffers(null);
    const qs = new URLSearchParams({ scope: "companies" });
    if (region !== "all") qs.set("region", region);
    fetch(`/api/offers?${qs}`)
      .then((r) => r.json())
      .then((d: { offers: Offer[] }) => setOffers(d.offers))
      .catch(() => setOffers([]));
  }, [region]);

  const companies = useMemo(
    () => groupByCompany((offers ?? []).filter((o) => region === "all" || region === null || o.region === region)),
    [offers, region],
  );

  function spontaneous(co: Company) {
    if (!profile) {
      window.location.href = `/${lang}/inscription`;
      return;
    }
    setPrep({
      id: `spontanee-${co.name.toLowerCase().replace(/\W+/g, "-")}`,
      title: profile.field || co.offers[0].title,
      company: co.name,
      city: co.cities[0] ?? "",
      region: co.region,
      contract: profile.contracts[0] ?? co.offers[0].contract,
      description: co.offers.map((o) => o.title).join(" · "),
      url: co.offers[0].url,
      source: co.offers[0].source,
      publishedAt: new Date().toISOString(),
    });
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>{c.title}</h1>
        <p>{c.lead}</p>
      </div>

      <div className="filters" style={{ marginBottom: 16 }} aria-label={c.filter}>
        <button className={region === "all" ? "chip on" : "chip"} onClick={() => setRegion("all")}>{t.offers.all}</button>
        {REGIONS.map((r) => (
          <button key={r} className={region === r ? "chip on" : "chip"} onClick={() => setRegion(r)}>{t.regions[r]}</button>
        ))}
      </div>

      {profile === null && (
        <p className="banner ok" style={{ marginBottom: 16 }}>
          {t.offers.noProfile} <Link href={`/${lang}/inscription`}>{t.nav.start} →</Link>
        </p>
      )}

      {offers === null ? (
        <div className="companies">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 82 }} />)}
        </div>
      ) : companies.length === 0 ? (
        <p className="empty">{c.empty}</p>
      ) : (
        <ul className="companies" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {companies.slice(0, 40).map((co) => (
            <li className="company" key={co.name}>
              <div className="company-head">
                <span className="avatar">{initials(co.name)}</span>
                <div className="grow">
                  <b>{co.name}</b>
                  <div className="muted small">
                    {[...new Set(co.cities.map((x) => cityLabel(x, lang)))].slice(0, 3).join(", ")} · {co.offers.length} {co.offers.length > 1 ? c.offers : c.one}
                  </div>
                </div>
                {co.offers.length > 1 && <span className="tag lime">{c.active}</span>}
              </div>
              <div className="sheet-actions">
                <button className="btn brand small" onClick={() => spontaneous(co)}>{c.spontaneous}</button>
                <button className="btn small" onClick={() => setOpen(open === co.name ? null : co.name)}>
                  {open === co.name ? c.hide : c.see}
                </button>
              </div>
              {open === co.name && (
                <ul className="company-offers">
                  {co.offers.map((o) => (
                    <li key={o.id}>
                      <a href={o.url} target="_blank" rel="noreferrer"><b>{o.title}</b></a>
                      <span className="muted">{t.contracts[o.contract]} · {cityLabel(o.city, lang)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="muted small" style={{ marginTop: 20 }}>{c.disclaimer}</p>

      {prep && profile && (
        <PrepSheet offer={prep} profile={profile} lang={lang} t={t} spontaneous onClose={() => setPrep(null)} />
      )}
    </main>
  );
}
