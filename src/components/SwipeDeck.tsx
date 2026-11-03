"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cityLabel } from "@/lib/belgium";
import { getDict } from "@/lib/i18n";
import { matchOffer, type MatchResult } from "@/lib/match";
import { store } from "@/lib/store";
import type { ContractType, Lang, Offer, Profile } from "@/lib/types";
import OfferCard, { MatchRing } from "./OfferCard";
import PrepSheet from "./PrepSheet";
import { IconHeart, IconInfo, IconPen, IconX } from "./Icons";

const CONTRACTS: ContractType[] = ["etudiant", "stage", "alternance", "cdd", "cdi"];
const THRESHOLD = 110;

interface Ranked {
  offer: Offer;
  m: MatchResult | null;
}

export default function SwipeDeck({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const o = t.offers;
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [meta, setMeta] = useState({ demo: false, filtered: 0 });
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [contract, setContract] = useState<ContractType | "all">("all");
  const [drag, setDrag] = useState(0);
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0);
  const [detail, setDetail] = useState<Ranked | null>(null);
  const [prep, setPrep] = useState<Offer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const start = useRef<number | null>(null);

  const load = useCallback((w: string, c: string, km?: number) => {
    setOffers(null);
    const qs = new URLSearchParams();
    if (w.trim()) qs.set("what", w.trim());
    if (c.trim()) qs.set("where", c.trim());
    if (km) qs.set("km", String(km));
    fetch(`/api/offers?${qs}`)
      .then((r) => r.json())
      .then((d: { offers: Offer[]; demo: boolean; filtered: number }) => {
        setOffers(d.offers);
        setMeta({ demo: d.demo, filtered: d.filtered ?? 0 });
      })
      .catch(() => setOffers([]));
  }, []);

  useEffect(() => {
    const p = store.getProfile();
    setProfile(p);
    setSeen(store.getSeen());
    const w = p?.field ?? "";
    const c = p?.city ?? "";
    setWhat(w);
    setWhere(c);
    load(w, c, p?.mobilityKm);
  }, [load]);

  const ranked: Ranked[] = useMemo(() => {
    if (!offers) return [];
    const list = offers
      .filter((x) => !seen.has(x.id))
      .filter((x) => contract === "all" || x.contract === contract)
      .map((offer) => ({ offer, m: profile ? matchOffer(offer, profile, lang) : null }));
    return profile
      ? list.sort((a, b) => (b.m?.score ?? 0) - (a.m?.score ?? 0) || b.offer.publishedAt.localeCompare(a.offer.publishedAt))
      : list.sort((a, b) => b.offer.publishedAt.localeCompare(a.offer.publishedAt));
  }, [offers, profile, seen, lang, contract]);

  const current = ranked[0];

  const decide = useCallback(
    (keep: boolean) => {
      if (!current || leaving) return;
      setLeaving(keep ? 1 : -1);
      setTimeout(() => {
        if (keep) {
          store.saveOffer(current.offer);
          setToast(o.saved);
          setTimeout(() => setToast(null), 2200);
        }
        store.markSeen(current.offer.id);
        setSeen((s) => new Set([...s, current.offer.id]));
        setDrag(0);
        setLeaving(0);
      }, 220);
    },
    [current, leaving, o.saved],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (detail || prep || (e.target as HTMLElement).closest?.("input, textarea, select")) return;
      if (e.key === "ArrowRight") decide(true);
      if (e.key === "ArrowLeft") decide(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, detail, prep]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    load(what, where, profile?.mobilityKm);
  }

  function openPrep(offer: Offer) {
    if (!profile) {
      window.location.href = `/${lang}/inscription`;
      return;
    }
    setDetail(null);
    setPrep(offer);
  }

  const x = leaving ? leaving * 600 : drag;
  const frontStyle: React.CSSProperties = {
    transform: `translateX(${x}px) rotate(${x / 22}deg)`,
    transition: start.current !== null ? "none" : "transform 0.22s ease-out",
  };

  return (
    <main className="page">
      <div className="page-head">
        <h1>{o.title}</h1>
        <p>{o.subtitle}</p>
      </div>

      <div className="feed">
        <form className="searchbar" onSubmit={search}>
          <input aria-label={o.what} placeholder={o.what} value={what} onChange={(e) => setWhat(e.target.value)} />
          <input aria-label={o.where} placeholder={o.where} value={where} onChange={(e) => setWhere(e.target.value)} />
          <button className="btn dark" type="submit">{o.search}</button>
        </form>

        <div className="filters">
          <button className={contract === "all" ? "chip on" : "chip"} onClick={() => setContract("all")}>{o.all}</button>
          {CONTRACTS.map((c) => (
            <button key={c} className={contract === c ? "chip on" : "chip"} onClick={() => setContract(c)}>{t.contracts[c]}</button>
          ))}
        </div>

        {meta.demo && <p className="banner">{o.demo}</p>}
        {profile === null && (
          <p className="banner ok">{o.noProfile} <Link href={`/${lang}/inscription`}>{t.nav.start} →</Link></p>
        )}

        {offers === null || profile === undefined ? (
          <div className="stack"><div className="skeleton" style={{ position: "absolute", inset: 0 }} aria-label={o.loading} /></div>
        ) : !current ? (
          <div className="empty">
            <p style={{ margin: 0 }}>{o.empty}</p>
            {seen.size > 0 && (
              <button className="btn" onClick={() => { store.resetSeen(); setSeen(new Set()); }}>{o.reset}</button>
            )}
          </div>
        ) : (
          <>
            <div className="stack">
              {ranked.slice(1, 3).reverse().map((r, i, arr) => (
                <OfferCard
                  key={r.offer.id}
                  offer={r.offer}
                  t={t}
                  lang={lang}
                  score={r.m?.score}
                  className={i === arr.length - 1 ? "behind" : "behind2"}
                />
              ))}
              <OfferCard
                key={current.offer.id}
                offer={current.offer}
                t={t}
                lang={lang}
                score={current.m?.score}
                className="front"
                style={frontStyle}
                handlers={{
                  onPointerDown: (e) => {
                    start.current = e.clientX;
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  },
                  onPointerMove: (e) => { if (start.current !== null) setDrag(e.clientX - start.current); },
                  onPointerUp: () => {
                    const moved = Math.abs(drag);
                    start.current = null;
                    if (drag > THRESHOLD) decide(true);
                    else if (drag < -THRESHOLD) decide(false);
                    else {
                      setDrag(0);
                      if (moved < 6) setDetail(current);
                    }
                  },
                  onPointerCancel: () => { start.current = null; setDrag(0); },
                }}
              >
                {drag > 40 && <span className="stamp keep" style={{ opacity: Math.min(1, drag / THRESHOLD) }}>{o.like}</span>}
                {drag < -40 && <span className="stamp pass" style={{ opacity: Math.min(1, -drag / THRESHOLD) }}>{o.pass}</span>}
                {current.m && current.m.reasons.length + current.m.warnings.length > 0 && (
                  <ul className="reasons">
                    {current.m.reasons.slice(0, 3).map((r) => <li key={r}>{r}</li>)}
                    {current.m.warnings.slice(0, 1).map((r) => <li key={r} className="minus">{r}</li>)}
                  </ul>
                )}
              </OfferCard>
            </div>

            <div className="deck-actions">
              <button className="icon-btn pass" onClick={() => decide(false)} aria-label={o.pass} title={`${o.pass} (←)`}><IconX /></button>
              <button className="icon-btn sm" onClick={() => setDetail(current)} aria-label={o.details} title={o.details}><IconInfo /></button>
              <button className="icon-btn sm" onClick={() => openPrep(current.offer)} aria-label={o.prepare} title={o.prepare}><IconPen /></button>
              <button className="icon-btn keep" onClick={() => decide(true)} aria-label={o.like} title={`${o.like} (→)`}><IconHeart /></button>
            </div>

            <div className="deck-meta">
              <span>{ranked.length} {o.left}</span>
              {meta.filtered > 0 && <span>{o.filtered} {meta.filtered}</span>}
            </div>
          </>
        )}
      </div>

      {detail && (
        <div className="sheet-bg" onClick={() => setDetail(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={detail.offer.title} onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <div>
                <span className="tag">{t.contracts[detail.offer.contract]}</span>
                <h2 style={{ marginTop: 10 }}>{detail.offer.title}</h2>
                <p className="muted" style={{ margin: 0 }}>{detail.offer.company} · {cityLabel(detail.offer.city, lang)}</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {detail.m && <MatchRing score={detail.m.score} label={o.match} />}
                <button className="close" onClick={() => setDetail(null)} aria-label={o.close}>✕</button>
              </div>
            </div>
            {detail.offer.salary && <p className="salary" style={{ margin: 0 }}>{detail.offer.salary}</p>}
            {detail.m && detail.m.reasons.length + detail.m.warnings.length > 0 && (
              <div className="panel" style={{ background: "var(--bg)" }}>
                <h3>{o.why}</h3>
                <ul className="reasons">
                  {detail.m.reasons.map((r) => <li key={r}>{r}</li>)}
                  {detail.m.warnings.map((r) => <li key={r} className="minus">{r}</li>)}
                </ul>
              </div>
            )}
            <p style={{ whiteSpace: "pre-line", margin: 0 }}>{detail.offer.description}</p>
            {detail.offer.description.trim().endsWith("…") && <p className="muted small" style={{ margin: 0 }}>{o.excerpt}</p>}
            <p className="muted small" style={{ margin: 0 }}>{o.source} : {detail.offer.source}</p>
            <div className="sheet-actions">
              {detail.offer.url && detail.offer.url !== "#" && (
                <a className="btn dark" href={detail.offer.url} target="_blank" rel="noreferrer">{o.open}</a>
              )}
              <button className="btn brand" onClick={() => openPrep(detail.offer)}>{o.prepare}</button>
              <button className="btn" onClick={() => { setDetail(null); decide(true); }}>{o.like}</button>
            </div>
          </div>
        </div>
      )}

      {prep && profile && (
        <PrepSheet
          offer={prep}
          profile={profile}
          lang={lang}
          t={t}
          onClose={() => setPrep(null)}
          onSaved={() => {
            store.markSeen(prep.id);
            setSeen((s) => new Set([...s, prep.id]));
            setToast(o.saved);
            setTimeout(() => setToast(null), 2200);
          }}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
