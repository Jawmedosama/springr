"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { emailInOffer } from "@/lib/accessible";
import { downloadFile, followUpMail, loadCvFile } from "@/lib/applyMail";
import { cityLabel } from "@/lib/belgium";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { Application, ApplicationStatus, Lang } from "@/lib/types";
import { initials } from "./OfferCard";
import SyncStatus from "./SyncStatus";

const STATUSES: ApplicationStatus[] = ["a_postuler", "envoyee", "entretien", "refusee", "acceptee"];

export default function ApplicationsList({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const a = t.apps;
  const [apps, setApps] = useState<Application[] | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus | "all" | "due">("all");
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setApps(store.getApps());
    loadCvFile().then((f) => setCvFile(f ?? null));
  }, []);

  function commit(next: Application[]) {
    setApps(next);
    store.setApps(next);
  }

  function update(id: string, patch: Partial<Application>) {
    if (!apps) return;
    commit(apps.map((x) => (x.offer.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x)));
  }

  /** Le message de relance, à copier ou à ouvrir dans sa messagerie. */
  function followUpBox(x: Application) {
    const profile = store.getProfile();
    if (!profile) return null;
    const mail = followUpMail(x.offer, profile, lang);
    const text = `${mail.subject}\n\n${mail.body}`;
    return (
      <div className="panel">
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{text}</p>
        <div className="sheet-actions">
          <button
            className="btn small"
            onClick={() => {
              navigator.clipboard?.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? t.prep.copied : a.copyFollowUp}
          </button>
          <a className="btn small dark" href={`mailto:${emailInOffer(x.offer) ?? ""}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`}>{t.applyMail.open}</a>
        </div>
      </div>
    );
  }

  if (!apps) return <main className="page" />;

  const isDue = (x: Application) => Boolean(x.remindAt && x.remindAt <= today && ["a_postuler", "envoyee"].includes(x.status));
  const shown = apps.filter((x) => (filter === "all" ? true : filter === "due" ? isDue(x) : x.status === filter));
  const sent = apps.filter((x) => x.status !== "a_postuler").length;
  const replies = apps.filter((x) => ["entretien", "refusee", "acceptee"].includes(x.status)).length;
  const dueCount = apps.filter(isDue).length;
  const kpis = [
    { n: String(sent), l: a.stats.sent, warn: false },
    { n: String(replies), l: a.stats.replies, warn: false },
    { n: String(apps.filter((x) => x.status === "entretien" || x.status === "acceptee").length), l: a.stats.interview, warn: false },
    { n: String(apps.filter((x) => x.status === "refusee").length), l: a.stats.refused, warn: false },
    { n: sent ? `${Math.round((replies / sent) * 100)} %` : "—", l: a.stats.rate, warn: false },
    { n: String(dueCount), l: a.stats.due, warn: true },
  ];

  return (
    <main className="page">
      <div className="page-head">
        <h1>{a.title}</h1>
        <p>{a.lead}</p>
      </div>

      <SyncStatus t={t} lang={lang} />

      {apps.length === 0 ? (
        <div className="empty">
          <p style={{ margin: 0 }}>{a.empty}</p>
          <Link className="btn dark" href={`/${lang}/offres`}>{a.goFeed}</Link>
        </div>
      ) : (
        <>
          {apps.some((x) => x.status === "a_postuler") && (
            <p style={{ margin: "0 0 16px" }}>
              <Link className="btn dark" href={`/${lang}/rafale`}>
                {t.burst.title} ({apps.filter((x) => x.status === "a_postuler").length})
              </Link>
            </p>
          )}

          {dueCount > 0 && (
            <p className="banner">
              {a.dueBanner.replace("{n}", String(dueCount))}{" "}
              <button className="link-btn" onClick={() => setFilter("due")}>{a.dueShow}</button>
            </p>
          )}

          <div className="kpis">
            {kpis.map((k) => (
              <div key={k.l} className={k.warn && dueCount > 0 ? "kpi warn" : "kpi"}><b>{k.n}</b><span>{k.l}</span></div>
            ))}
          </div>

          <div className="filters" style={{ marginBottom: 16 }}>
            <button className={filter === "all" ? "chip on" : "chip"} onClick={() => setFilter("all")}>{a.all}</button>
            <button className={filter === "due" ? "chip on" : "chip"} onClick={() => setFilter("due")}>{a.due}</button>
            {STATUSES.map((s) => (
              <button key={s} className={filter === s ? "chip on" : "chip"} onClick={() => setFilter(s)}>{t.status[s]}</button>
            ))}
          </div>

          <ul className="apps">
            {shown.map((x) => {
              const due = isDue(x);
              return (
                <li key={x.offer.id} className={due ? "app due" : "app"}>
                  <div className="app-head">
                    <span className="avatar">{initials(x.offer.company || x.offer.title)}</span>
                    <div className="grow">
                      <a href={x.offer.url} target="_blank" rel="noreferrer"><b>{x.spontaneous ? x.offer.company : x.offer.title}</b></a>
                      <div className="muted small">
                        {x.spontaneous ? a.spontaneous : x.offer.company} · {cityLabel(x.offer.city, lang)}
                      </div>
                    </div>
                    {due && <span className="tag warn">{a.due}</span>}
                  </div>
                  <div className="app-controls">
                    <label className="small">{a.status}
                      <select className={`status status-${x.status}`} value={x.status} onChange={(e) => update(x.offer.id, { status: e.target.value as ApplicationStatus })}>
                        {STATUSES.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
                      </select>
                    </label>
                    <label className="small">{a.remind}
                      <input type="date" value={x.remindAt ?? ""} onChange={(e) => update(x.offer.id, { remindAt: e.target.value })} />
                    </label>
                    {x.offer.url && x.offer.url !== "#" && (
                      <a className="btn small dark" href={x.offer.url} target="_blank" rel="noreferrer">{a.openAd} ↗</a>
                    )}
                    {cvFile && <button className="btn small" onClick={() => downloadFile(cvFile)}>{t.prep.downloadCv}</button>}
                    {x.status === "envoyee" && (
                      <button className={due ? "btn small brand" : "btn small"} onClick={() => setFollowUp(followUp === x.offer.id ? null : x.offer.id)}>{a.followUp}</button>
                    )}
                    <button className="btn small ghost" onClick={() => {
                      store.removeApp(x.offer.id);
                      setApps(store.getApps());
                    }}>{a.remove}</button>
                  </div>
                  {followUp === x.offer.id && followUpBox(x)}
                  <textarea
                    aria-label={a.notes}
                    placeholder={a.notesPlaceholder}
                    defaultValue={x.notes ?? ""}
                    onBlur={(e) => e.target.value !== (x.notes ?? "") && update(x.offer.id, { notes: e.target.value })}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}

    </main>
  );
}
