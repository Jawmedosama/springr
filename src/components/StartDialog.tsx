"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { regionFromPlace } from "@/lib/belgium";
import { NO_FILTERS, saveFilters } from "@/lib/filters";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import type { ContractType, Lang, Region } from "@/lib/types";

export type StartMode = "choice" | "login" | "signup" | "guest";

const CONTRACTS: ContractType[] = ["etudiant", "flexi", "stage", "cdd", "cdi"];
const REGIONS: Region[] = ["bruxelles", "wallonie", "flandre"];

/** Fenêtre d'accueil : se connecter, créer un compte, ou essayer en invité. */
export default function StartDialog({ lang, mode = "choice", onClose }: { lang: Lang; mode?: StartMode; onClose: () => void }) {
  const t = getDict(lang);
  const s = t.start;
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<StartMode>(mode);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState<Region | null>(null);
  const [contracts, setContracts] = useState<ContractType[]>([]);

  // Échap ferme la fenêtre, et Tab reste à l'intérieur.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !box.current) return;
      const items = [...box.current.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input")];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      before?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    box.current?.querySelector<HTMLElement>("input, .start-choice, button:not(.close)")?.focus();
  }, [view]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !email.trim()) return;
    setState("busy");
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/${lang}/profil` },
    });
    setState(error ? "error" : "sent");
  }

  function startGuest(e: React.FormEvent) {
    e.preventDefault();
    const place = city.trim();
    const area = region ?? (place ? regionFromPlace(place) : undefined) ?? null;
    store.setGuest({ city: place, region: area, contracts });
    saveFilters({ ...NO_FILTERS, regions: area && !place ? [area] : [] });
    window.location.href = `/${lang}/offres`;
  }

  const emailView = view === "login" || view === "signup";
  const title = view === "login" ? s.login : view === "signup" ? s.signup : view === "guest" ? s.guest : s.title;

  return createPortal(
    <div className="sheet-bg" onClick={onClose}>
      <div ref={box} className="sheet start-sheet" role="dialog" aria-modal="true" aria-labelledby="start-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 id="start-title">{title}</h2>
          <button className="close" onClick={onClose} aria-label={t.offers.close}>✕</button>
        </div>

        {view === "choice" && (
          <>
            <p className="muted" style={{ margin: 0 }}>{s.lead}</p>
            <button className="btn dark block start-choice" onClick={() => setView("login")}>{s.login}</button>
            <button className="btn brand block" onClick={() => setView("signup")}>{s.signup}</button>
            <button className="btn block" onClick={() => setView("guest")}>{s.guest}</button>
            <p className="muted small" style={{ margin: 0 }}>{s.guestHint}</p>
          </>
        )}

        {emailView && (
          !getSupabase() ? (
            <>
              <p className="banner">{t.auth.unavailable}</p>
              <Link className="btn dark block" href={`/${lang}/inscription`} onClick={onClose}>{t.profile.create}</Link>
            </>
          ) : state === "sent" ? (
            <p className="banner ok">{s.sent}</p>
          ) : (
            <form onSubmit={sendLink} style={{ display: "grid", gap: 12 }}>
              <p className="muted" style={{ margin: 0 }}>{view === "login" ? s.loginText : s.signupText}</p>
              <label>{t.auth.email}
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              {state === "error" && <p className="error" role="alert" style={{ margin: 0 }}>{t.auth.error}</p>}
              <button className="btn dark block" type="submit" disabled={state === "busy"}>{state === "busy" ? t.auth.sending : t.auth.send}</button>
              <p className="muted small" style={{ margin: 0 }}>{s.sameBrowser}</p>
            </form>
          )
        )}

        {view === "guest" && (
          <form onSubmit={startGuest} style={{ display: "grid", gap: 12 }}>
            <p className="muted" style={{ margin: 0 }}>{s.guestText}</p>
            <label>{s.city}
              <input value={city} placeholder={s.cityHint} onChange={(e) => setCity(e.target.value)} />
            </label>
            <div className="filters" role="group" aria-label={t.filters.region}>
              <button type="button" className={region === null ? "chip on" : "chip"} aria-pressed={region === null} onClick={() => setRegion(null)}>{t.filters.allBelgium}</button>
              {REGIONS.map((r) => (
                <button key={r} type="button" className={region === r ? "chip on" : "chip"} aria-pressed={region === r} onClick={() => setRegion(r)}>{t.regions[r]}</button>
              ))}
            </div>
            <div className="filters" role="group" aria-label={t.filters.contract}>
              {CONTRACTS.map((c) => {
                const on = contracts.includes(c);
                return (
                  <button key={c} type="button" className={on ? "chip on" : "chip"} aria-pressed={on} onClick={() => setContracts(on ? contracts.filter((x) => x !== c) : [...contracts, c])}>{t.contracts[c]}</button>
                );
              })}
            </div>
            <button className="btn brand block" type="submit">{s.guestGo}</button>
          </form>
        )}

        {view !== "choice" && mode === "choice" && state !== "sent" && (
          <button className="link-btn" onClick={() => setView("choice")}>{t.signup.back}</button>
        )}
      </div>
    </div>,
    document.body,
  );
}
