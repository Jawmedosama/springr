"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mailForOffer } from "@/lib/applyMail";
import { cityLabel } from "@/lib/belgium";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { Lang, Offer, Profile, Region } from "@/lib/types";
import { initials } from "./OfferCard";

interface Company {
  name: string;
  count: number;
  cities: string[];
  sector?: string;
  region?: Region;
  offers: Offer[];
}

const REGIONS: Region[] = ["bruxelles", "wallonie", "flandre"];

export default function CompanyList({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const c = t.companies;
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [total, setTotal] = useState(0);
  const [sectors, setSectors] = useState<string[]>([]);
  const [region, setRegion] = useState<Region | "all" | null>(null);
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const p = store.getProfile();
    setProfile(p);
    setRegion(p?.region ?? "all");
  }, []);

  useEffect(() => {
    if (region === null) return;
    setCompanies(null);
    const qs = new URLSearchParams();
    if (region !== "all") qs.set("region", region);
    if (sector) qs.set("sector", sector);
    if (search) qs.set("city", search);
    fetch(`/api/companies?${qs}`)
      .then((r) => r.json())
      .then((d: { companies: Company[]; total: number; sectors: string[] }) => {
        setCompanies(d.companies);
        setTotal(d.total);
        setSectors((old) => (sector ? old : d.sectors));
      })
      .catch(() => setCompanies([]));
  }, [region, sector, search]);

  /** Candidature spontanée : le mail type, avec le nom de l'entreprise. */
  function copyMail(co: Company) {
    if (!profile) {
      window.location.href = `/${lang}/inscription`;
      return;
    }
    const offer = { ...co.offers[0], title: profile.field || co.offers[0].title, company: co.name };
    const m = mailForOffer(offer, profile, lang);
    navigator.clipboard?.writeText(`${m.subject}\n\n${m.body}`);
    setCopied(co.name);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>{c.title}</h1>
        <p>{c.lead}</p>
      </div>

      <div className="filters" style={{ marginBottom: 12 }} aria-label={c.filter}>
        <button className={region === "all" ? "chip on" : "chip"} onClick={() => setRegion("all")}>{t.offers.all}</button>
        {REGIONS.map((r) => (
          <button key={r} className={region === r ? "chip on" : "chip"} onClick={() => setRegion(r)}>{t.regions[r]}</button>
        ))}
      </div>

      <form
        className="grid2"
        style={{ marginBottom: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(city.trim());
        }}
      >
        <select aria-label={c.sector} value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">{c.allSectors}</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input aria-label={c.city} placeholder={c.city} value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => setSearch(city.trim())} />
      </form>

      {profile === null && (
        <p className="banner ok" style={{ marginBottom: 16 }}>
          {t.offers.noProfile} <Link href={`/${lang}/inscription`}>{t.nav.start} →</Link>
        </p>
      )}

      {companies === null ? (
        <div className="companies">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 82 }} />)}
        </div>
      ) : companies.length === 0 ? (
        <p className="empty">{c.empty}</p>
      ) : (
        <>
          <p className="muted small">{total} {c.found}</p>
          <ul className="companies" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {companies.map((co) => (
              <li className="company" key={co.name}>
                <div className="company-head">
                  <span className="avatar">{initials(co.name)}</span>
                  <div className="grow">
                    <b>{co.name}</b>
                    <div className="muted small">
                      {[...new Set(co.cities.map((x) => cityLabel(x, lang)))].join(", ")} · {co.count} {co.count > 1 ? c.offers : c.one}
                    </div>
                    {co.sector && <div className="muted small">{co.sector}</div>}
                  </div>
                  {co.count > 1 && <span className="tag lime">{c.active}</span>}
                </div>
                <div className="sheet-actions">
                  <button className="btn brand small" onClick={() => copyMail(co)}>{copied === co.name ? t.prep.copied : c.spontaneous}</button>
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
        </>
      )}

      <p className="muted small" style={{ marginTop: 20 }}>{c.disclaimer}</p>
    </main>
  );
}
