"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { matchOffer } from "@/lib/match";
import { store } from "@/lib/store";
import type { Lang, Offer, Profile } from "@/lib/types";

export default function SwipeDeck({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const o = t.offers;
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [letter, setLetter] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    setProfile(store.getProfile());
    setSeen(store.getSeen());
    fetch("/api/offers")
      .then((r) => r.json())
      .then((d: { offers: Offer[]; demo: boolean }) => {
        setOffers(d.offers);
        setDemo(d.demo);
      })
      .catch(() => setOffers([]));
  }, []);

  const ranked = useMemo(() => {
    if (!offers || !profile) return [];
    return offers
      .filter((x) => !seen.has(x.id))
      .map((offer) => ({ offer, m: matchOffer(offer, profile, lang) }))
      .sort((a, b) => b.m.score - a.m.score);
  }, [offers, profile, seen, lang]);

  if (profile === undefined || offers === null) return <p className="muted">{o.loading}</p>;
  if (!profile)
    return (
      <div className="empty">
        <p>{o.noProfile}</p>
        <Link className="btn primary" href={`/${lang}/inscription`}>{t.home.cta}</Link>
      </div>
    );

  const current = ranked[0];

  function decide(keep: boolean) {
    if (!current) return;
    if (keep) store.saveOffer(current.offer);
    store.markSeen(current.offer.id);
    setSeen(new Set([...seen, current.offer.id]));
    setLetter(null);
    setDrag(0);
  }

  async function writeLetter() {
    if (!current || !profile) return;
    setBusy(true);
    const { firstName, lastName, studyLevel, field, skills, languages } = profile;
    const r = await fetch("/api/letter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ offer: current.offer, profile: { firstName, lastName, studyLevel, field, skills, languages }, lang }),
    }).then((x) => x.json()).catch(() => null);
    setLetter(r?.letter ?? null);
    setBusy(false);
  }

  return (
    <div className="deck">
      <h1>{o.title}</h1>
      {demo && <p className="banner">{lang === "nl" ? "Demo: fictieve vacatures. Voeg de Adzuna- of Forem-sleutels toe om echte vacatures te zien." : "Démo : offres fictives. Ajoute les clés Adzuna ou Forem pour voir de vraies offres."}</p>}
      {!current ? (
        <p className="empty">{o.empty}</p>
      ) : (
        <>
          <article
            className="offer"
            style={{ transform: `translateX(${drag}px) rotate(${drag / 25}deg)` }}
            onPointerDown={(e) => { start.current = e.clientX; }}
            onPointerMove={(e) => { if (start.current !== null) setDrag(e.clientX - start.current); }}
            onPointerUp={() => {
              start.current = null;
              if (drag > 110) decide(true);
              else if (drag < -110) decide(false);
              else setDrag(0);
            }}
            onPointerCancel={() => { start.current = null; setDrag(0); }}
          >
            <div className="offer-head">
              <span className="tag">{t.contracts[current.offer.contract]}</span>
              <span className="score" title={o.match}>{current.m.score}%</span>
            </div>
            <h2>{current.offer.title}</h2>
            <p className="company">
              {current.offer.company} · {current.offer.city}
              {current.offer.region && t.regions[current.offer.region] !== current.offer.city ? ` · ${t.regions[current.offer.region]}` : ""}
            </p>
            {current.offer.salary && <p className="muted">{current.offer.salary}</p>}
            <p className="desc">{current.offer.description}</p>
            {current.m.reasons.length > 0 && (
              <ul className="reasons">{current.m.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            )}
            <p className="muted small">{o.source} : {current.offer.source}</p>
          </article>
          <div className="actions">
            <button className="btn round" onClick={() => decide(false)} aria-label={o.pass}>✕ {o.pass}</button>
            <a className="btn" href={current.offer.url} target="_blank" rel="noreferrer">{o.open}</a>
            <button className="btn round primary" onClick={() => decide(true)} aria-label={o.like}>♥ {o.like}</button>
          </div>
          <div className="letter-box">
            <button className="btn" onClick={writeLetter} disabled={busy}>{busy ? o.letterLoading : o.letter}</button>
            {letter && (
              <>
                <textarea value={letter} onChange={(e) => setLetter(e.target.value)} rows={12} />
                <button className="btn" onClick={() => navigator.clipboard?.writeText(letter)}>{o.copy}</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
