"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { emailInOffer } from "@/lib/accessible";
import { downloadFile, loadCvFile, mailForOffer } from "@/lib/applyMail";
import { cityLabel } from "@/lib/belgium";
import { getDict } from "@/lib/i18n";
import { FOLLOW_UP_DAYS, inDays, store } from "@/lib/store";
import type { Application, Lang, Profile } from "@/lib/types";
import EmailApply from "./EmailApply";

/** Mode rafale : enchaîne les offres gardées. Chaque envoi reste fait et validé par la personne. */
export default function Burst({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const r = t.burst;
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [queue, setQueue] = useState<Application[]>([]);
  const [index, setIndex] = useState(0);
  const [sent, setSent] = useState(0);
  const [copied, setCopied] = useState(false);
  const [mail, setMail] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    setProfile(store.getProfile());
    setQueue(store.getApps().filter((a) => a.status === "a_postuler"));
    loadCvFile().then((f) => setCvFile(f ?? null));
  }, []);

  const current = queue[index];

  function next(done: boolean) {
    if (!current) return;
    if (done) {
      store.saveOffer(current.offer, { status: "envoyee", remindAt: inDays(FOLLOW_UP_DAYS) });
      setSent((n) => n + 1);
    }
    setCopied(false);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }

  function copyMail() {
    if (!current || !profile) return;
    const m = mailForOffer(current.offer, profile, lang);
    navigator.clipboard?.writeText(`${m.subject}\n\n${m.body}`);
    setCopied(true);
  }

  if (profile === undefined) return <main className="page" />;

  return (
    <main className="page">
      <div className="page-head">
        <h1>{r.title}</h1>
        <p>{r.lead}</p>
      </div>

      {!profile ? (
        <div className="empty">
          <p style={{ margin: 0 }}>{t.offers.noProfile}</p>
          <Link className="btn dark" href={`/${lang}/inscription`}>{t.nav.start}</Link>
        </div>
      ) : !current ? (
        <div className="empty">
          <p style={{ margin: 0 }}>{sent > 0 ? r.done.replace("{n}", String(sent)) : r.empty}</p>
          <Link className="btn dark" href={`/${lang}/offres`}>{t.apps.goFeed}</Link>
        </div>
      ) : (
        <div className="form">
          <div>
            <div className="burst-bar" aria-hidden><span style={{ width: `${(index / queue.length) * 100}%` }} /></div>
            <p className="step-label" style={{ marginTop: 8 }}>{index + 1} / {queue.length}</p>
          </div>

          <section className="panel">
            <div>
              <span className="tag">{t.contracts[current.offer.contract]}</span>
              <h2 style={{ margin: "10px 0 4px", fontSize: "1.4rem" }}>{current.offer.title}</h2>
              <p className="muted" style={{ margin: 0 }}>{current.offer.company} · {cityLabel(current.offer.city, lang)}</p>
            </div>
            {current.offer.url && current.offer.url !== "#" && (
              <a className="btn dark block" href={current.offer.url} target="_blank" rel="noreferrer">{t.apps.openAd} ↗</a>
            )}
            <div className="sheet-actions">
              <button className="btn small" onClick={copyMail}>{copied ? t.prep.copied : t.applyMail.copyMail}</button>
              {cvFile ? (
                <button className="btn small" onClick={() => downloadFile(cvFile)}>{t.prep.downloadCv}</button>
              ) : (
                <Link className="btn small" href={`/${lang}/profil`}>{t.prep.addCv}</Link>
              )}
              {emailInOffer(current.offer) && <button className="btn small" onClick={() => setMail(true)}>{t.applyMail.button}</button>}
            </div>
            <p className="muted small" style={{ margin: 0 }}>{r.review}</p>
          </section>

          <div className="form-nav">
            <button className="btn" onClick={() => next(false)}>{r.skip}</button>
            <button className="btn brand" onClick={() => next(true)}>{r.sent}</button>
          </div>
        </div>
      )}

      {mail && current && profile && (
        <EmailApply
          offer={current.offer}
          profile={profile}
          lang={lang}
          t={t}
          onClose={() => setMail(false)}
          onSent={() => {
            setSent((n) => n + 1);
            setIndex((i) => i + 1);
          }}
        />
      )}
    </main>
  );
}
