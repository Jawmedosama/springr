"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cityLabel } from "@/lib/belgium";
import { activeCount, feedQuery, loadFilters, NO_FILTERS, saveFilters, type Filters } from "@/lib/filters";
import { getDict } from "@/lib/i18n";
import { matchOffer, type MatchResult } from "@/lib/match";
import { guestProfile, store } from "@/lib/store";
import { minutes, travelTo, type Geo } from "@/lib/travel";
import type { Lang, Offer, Profile } from "@/lib/types";
import FilterPanel from "./FilterPanel";
import InstallHint from "./InstallHint";
import OfferCard, { MatchRing } from "./OfferCard";
import PrepSheet from "./PrepSheet";
import SearchElsewhere from "./SearchElsewhere";
import StartButton from "./StartButton";
import StartDialog from "./StartDialog";
import { IconHeart, IconInfo, IconPen, IconX } from "./Icons";

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
  const [demo, setDemo] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [drag, setDrag] = useState(0);
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0);
  const [detail, setDetail] = useState<Ranked | null>(null);
  const [prep, setPrep] = useState<Offer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const start = useRef<number | null>(null);

  const latest = useRef(0);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [hiddenByFrench, setHiddenByFrench] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const lastVisit = useRef<string | undefined>(undefined);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [gone, setGone] = useState<string | null>(null);
  const [askAccount, setAskAccount] = useState(false);

  const fetchPage = useCallback(
    (w: string, c: string, f: Filters, p: Profile | null, n: number) =>
      fetch("/api/feed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...feedQuery(w, c, f, p?.mobilityKm),
          lang,
          page: n,
          since: lastVisit.current,
          taste: store.getTaste(),
          profile: p && {
            contracts: p.contracts,
            region: p.region,
            skills: p.skills,
            field: p.field,
            languages: p.languages,
            experienced: (p.cvText ?? "").length >= 400,
          },
        }),
      }).then((r) => r.json() as Promise<{ offers: Offer[]; total: number; hiddenByFrench: number; newCount: number; hasMore: boolean; demo: boolean }>),
    [lang],
  );

  const load = useCallback(
    (w: string, c: string, f: Filters, p: Profile | null) => {
      setOffers(null);
      setPage(0);
      const id = ++latest.current;
      fetchPage(w, c, f, p, 0)
        .then((d) => {
          if (id !== latest.current) return;
          setOffers(d.offers);
          setTotal(d.total);
          setHiddenByFrench(d.hiddenByFrench);
          setNewCount(d.newCount);
          setHasMore(d.hasMore);
          setDemo(d.demo);
        })
        .catch(() => setOffers([]));
    },
    [fetchPage],
  );

  useEffect(() => {
    const guest = store.getGuest();
    const p = store.getProfile() ?? (guest ? guestProfile(guest, lang) : null);
    setProfile(p);
    setSeen(store.getSeen());
    try {
      lastVisit.current = localStorage.getItem("springr.lastVisit") ?? undefined;
      localStorage.setItem("springr.lastVisit", new Date().toISOString());
    } catch {
      /* stockage indisponible */
    }
    if (p?.city || p?.postcode) fetch("/geo-be.json").then((r) => r.json() as Promise<Geo>).then(setGeo).catch(() => setGeo(null));
    const w = p?.field ?? "";
    const c = p?.city ?? "";
    setWhat(w);
    setWhere(c);
    const f = loadFilters();
    setFilters(f);
    load(w, c, f, p);
  }, [load, lang]);

  // Le serveur a déjà filtré et classé toutes les offres : on garde son ordre.
  const ranked: Ranked[] = useMemo(
    () => (offers ?? []).filter((x) => !seen.has(x.id)).map((offer) => ({ offer, m: profile ? matchOffer(offer, profile, lang, store.getTaste()) : null })),
    [offers, profile, seen, lang],
  );

  const current = ranked[0];

  const decide = useCallback(
    (keep: boolean) => {
      if (!current || leaving) return;
      setLeaving(keep ? 1 : -1);
      setTimeout(() => {
        store.learnFrom(current.offer, keep);
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

  /** Ajoute la page suivante, dans l'ordre du classement. */
  const loadMore = useCallback(async () => {
    const next = page + 1;
    const id = latest.current;
    setMore(true);
    const d = await fetchPage(what, where, filters, profile ?? null, next).catch(() => null);
    setMore(false);
    if (!d || id !== latest.current) return;
    setOffers((list) => {
      const ids = new Set((list ?? []).map((x) => x.id));
      return [...(list ?? []), ...d.offers.filter((x) => !ids.has(x.id))];
    });
    setHasMore(d.hasMore);
    setPage(next);
  }, [page, fetchPage, what, where, filters, profile]);

  // Il reste peu de cartes : la suite arrive toute seule, jusqu'à la dernière offre.
  useEffect(() => {
    if (offers && hasMore && !more && ranked.length <= 5) void loadMore();
  }, [offers, hasMore, more, ranked.length, loadMore]);

  function changeFilters(next: Filters) {
    setFilters(next);
    saveFilters(next);
    load(what, where, next, profile ?? null);
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    load(what, where, filters, profile ?? null);
  }

  const trip = (offer: Offer) => (profile && geo ? travelTo(offer, profile, geo) : null);
  const tripLabel = (offer: Offer) => {
    const x = trip(offer);
    return x ? o.tripShort.replace("{km}", String(x.km)).replace("{car}", minutes(x.car)) : undefined;
  };

  /** Vérifie l'annonce à l'ouverture : seule une réponse claire du site la signale. */
  function openDetail(r: Ranked) {
    setDetail(r);
    if (!r.offer.url || r.offer.url === "#") return;
    fetch(`/api/check-link?url=${encodeURIComponent(r.offer.url)}`)
      .then((x) => x.json() as Promise<{ gone: boolean }>)
      .then((d) => d.gone && setGone(r.offer.id))
      .catch(() => undefined);
  }

  function openPrep(offer: Offer) {
    setDetail(null);
    if (!store.getProfile()) {
      setAskAccount(true);
      return;
    }
    setPrep(offer);
  }

  const x = leaving ? leaving * 600 : drag;
  const frontStyle: React.CSSProperties = {
    transform: `translateX(${x}px) rotate(${x / 22}deg)`,
    transition: start.current !== null ? "none" : "transform 0.22s ease-out",
  };

  return (
    <main className="page feed-page">
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

        <FilterPanel t={t} filters={filters} count={total} hiddenByFrench={hiddenByFrench} onChange={changeFilters} />

        {demo && <p className="banner">{o.demo}</p>}
        {newCount > 0 && <p className="banner ok">{o.newSince.replace("{n}", String(newCount))}</p>}
        {profile === null && (
          <p className="banner ok">{o.noProfile} <StartButton lang={lang} className="link-btn">{t.nav.start} →</StartButton></p>
        )}

        {offers === null || profile === undefined ? (
          <div className="stack"><div className="skeleton" style={{ position: "absolute", inset: 0 }} aria-label={o.loading} /></div>
        ) : !current ? (
          <div className="empty">
            <p style={{ margin: 0 }}>{more || hasMore ? o.loading : total === 0 ? (activeCount(filters) > 0 ? t.filters.none : o.empty) : o.allSeen}</p>
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
                  travel={tripLabel(r.offer)}
                  className={i === arr.length - 1 ? "behind" : "behind2"}
                />
              ))}
              <OfferCard
                key={current.offer.id}
                offer={current.offer}
                t={t}
                lang={lang}
                score={current.m?.score}
                travel={tripLabel(current.offer)}
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
                      if (moved < 6) openDetail(current);
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
              <button className="icon-btn sm" onClick={() => openDetail(current)} aria-label={o.details} title={o.details}><IconInfo /></button>
              <button className="icon-btn sm" onClick={() => openPrep(current.offer)} aria-label={o.prepare} title={o.prepare}><IconPen /></button>
              <button className="icon-btn keep" onClick={() => decide(true)} aria-label={o.like} title={`${o.like} (→)`}><IconHeart /></button>
            </div>

            <div className="deck-meta">
              <span>{ranked.length} {o.left}</span>
              <Link className="chip" href={`/${lang}/rafale`} style={{ textDecoration: "none" }}>{t.burst.title} →</Link>
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 16 }}><InstallHint text={o.installIos} close={o.close} /></div>

      {offers !== null && hasMore && (
        <button className="btn block" style={{ marginTop: 16 }} disabled={more} onClick={loadMore}>{more ? o.loading : o.more}</button>
      )}

      <SearchElsewhere t={t} what={what} where={where} />

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
            {gone === detail.offer.id && <p className="banner">{o.maybeExpired}</p>}
            <dl className="dl">
              {detail.offer.salary && (<><dt>{o.salary}</dt><dd className="salary">{detail.offer.salary}</dd></>)}
              <dt>{o.contract}</dt>
              <dd>{t.contracts[detail.offer.contract]}</dd>
              {detail.offer.regime && (<><dt>{o.regime}</dt><dd>{detail.offer.regime}</dd></>)}
              {trip(detail.offer) && (
                <>
                  <dt>{o.distance}</dt>
                  <dd>
                    {o.tripLong
                      .replace("{km}", String(trip(detail.offer)?.km))
                      .replace("{car}", minutes(trip(detail.offer)?.car ?? 0))
                      .replace("{transit}", minutes(trip(detail.offer)?.transit ?? 0))}
                  </dd>
                </>
              )}
              <dt>{o.published}</dt>
              <dd>{new Date(detail.offer.publishedAt).toLocaleDateString(lang === "nl" ? "nl-BE" : "fr-BE")}</dd>
            </dl>
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
            <p className="muted small" style={{ margin: 0 }}>
              {o.source} : {detail.offer.source}
              {detail.offer.altSources?.map((a) => (
                <span key={a.url}> · <a href={a.url} target="_blank" rel="noreferrer">{a.source}</a></span>
              ))}
            </p>
            <SearchElsewhere t={t} what={detail.offer.title} where={cityLabel(detail.offer.city, lang)} />
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

      {askAccount && <StartDialog lang={lang} mode="signup" onClose={() => setAskAccount(false)} />}

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
