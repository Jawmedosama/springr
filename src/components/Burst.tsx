"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { emailInOffer, mailtoLink } from "@/lib/accessible";
import { cityLabel } from "@/lib/belgium";
import { getDict } from "@/lib/i18n";
import { FOLLOW_UP_DAYS, inDays, store } from "@/lib/store";
import { toAiProfile, type Application, type Lang, type Profile } from "@/lib/types";

/** Mode rafale : enchaîne les offres gardées. Chaque envoi reste fait et validé par la personne. */
export default function Burst({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const r = t.burst;
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [queue, setQueue] = useState<Application[]>([]);
  const [index, setIndex] = useState(0);
  const [sent, setSent] = useState(0);
  const [letter, setLetter] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setProfile(store.getProfile());
    setQueue(store.getApps().filter((a) => a.status === "a_postuler"));
  }, []);

  const current = queue[index];

  const prepare = useCallback(
    async (app: Application, p: Profile) => {
      setCopied(false);
      if (app.letter) {
        setLetter(app.letter);
        return;
      }
      setLetter("");
      setBusy(true);
      const res = await fetch("/api/letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offer: app.offer, profile: toAiProfile(p), lang, spontaneous: app.spontaneous }),
      })
        .then((x) => x.json() as Promise<{ letter: string }>)
        .catch(() => null);
      setLetter(res?.letter ?? "");
      setBusy(false);
    },
    [lang],
  );

  useEffect(() => {
    if (current && profile) void prepare(current, profile);
  }, [current, profile, prepare]);

  function next(done: boolean) {
    if (!current) return;
    if (done) {
      store.saveOffer(current.offer, { status: "envoyee", letter, remindAt: inDays(FOLLOW_UP_DAYS) });
      setSent((n) => n + 1);
    }
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }

  async function copyAndOpen() {
    await navigator.clipboard?.writeText(letter).catch(() => undefined);
    setCopied(true);
    if (current.offer.url && current.offer.url !== "#") window.open(current.offer.url, "_blank", "noreferrer");
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
            {busy ? (
              <div className="skeleton" style={{ height: 240, borderRadius: 14 }} aria-label={t.prep.loading} />
            ) : (
              <textarea className="doc" rows={11} value={letter} onChange={(e) => setLetter(e.target.value)} />
            )}
            <p className="muted small" style={{ margin: 0 }}>{r.review}</p>
          </section>

          <div className="sheet-actions">
            <button className="btn dark" disabled={busy || !letter} onClick={copyAndOpen}>{copied ? r.copied : r.open}</button>
            {emailInOffer(current.offer) && (
              <a className="btn" href={mailtoLink(current.offer, letter, `${r.subject} ${current.offer.title}`, profile.phone)}>{r.email}</a>
            )}
          </div>
          <div className="form-nav">
            <button className="btn" onClick={() => next(false)}>{r.skip}</button>
            <button className="btn brand" onClick={() => next(true)}>{r.sent}</button>
          </div>
        </div>
      )}
    </main>
  );
}
