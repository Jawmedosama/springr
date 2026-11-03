"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cityLabel } from "@/lib/belgium";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { Application, ApplicationStatus, Lang, Profile } from "@/lib/types";
import { initials } from "./OfferCard";
import PrepSheet from "./PrepSheet";

const STATUSES: ApplicationStatus[] = ["a_postuler", "envoyee", "entretien", "refusee", "acceptee"];

export default function ApplicationsList({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const a = t.apps;
  const [apps, setApps] = useState<Application[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus | "all" | "due">("all");
  const [prep, setPrep] = useState<Application | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setApps(store.getApps());
    setProfile(store.getProfile());
  }, []);

  function commit(next: Application[]) {
    setApps(next);
    store.setApps(next);
  }

  function update(id: string, patch: Partial<Application>) {
    if (!apps) return;
    commit(apps.map((x) => (x.offer.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x)));
  }

  if (!apps) return <main className="page" />;

  const isDue = (x: Application) => Boolean(x.remindAt && x.remindAt <= today && ["a_postuler", "envoyee"].includes(x.status));
  const shown = apps.filter((x) => (filter === "all" ? true : filter === "due" ? isDue(x) : x.status === filter));
  const kpis = [
    { n: apps.length, l: a.stats.total, warn: false },
    { n: apps.filter((x) => x.status !== "a_postuler").length, l: a.stats.sent, warn: false },
    { n: apps.filter((x) => x.status === "entretien" || x.status === "acceptee").length, l: a.stats.interview, warn: false },
    { n: apps.filter(isDue).length, l: a.stats.due, warn: true },
  ];

  return (
    <main className="page">
      <div className="page-head">
        <h1>{a.title}</h1>
        <p>{a.lead}</p>
      </div>

      {apps.length === 0 ? (
        <div className="empty">
          <p style={{ margin: 0 }}>{a.empty}</p>
          <Link className="btn dark" href={`/${lang}/offres`}>{a.goFeed}</Link>
        </div>
      ) : (
        <>
          <div className="kpis">
            {kpis.map((k) => (
              <div key={k.l} className={k.warn && k.n > 0 ? "kpi warn" : "kpi"}><b>{k.n}</b><span>{k.l}</span></div>
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
                    {profile && <button className="btn small" onClick={() => setPrep(x)}>{a.prepare}</button>}
                    <button className="btn small ghost" onClick={() => {
                      store.removeApp(x.offer.id);
                      setApps(store.getApps());
                    }}>{a.remove}</button>
                  </div>
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

      {prep && profile && (
        <PrepSheet
          offer={prep.offer}
          profile={profile}
          lang={lang}
          t={t}
          spontaneous={prep.spontaneous}
          onClose={() => setPrep(null)}
          onSaved={() => setApps(store.getApps())}
        />
      )}
    </main>
  );
}
