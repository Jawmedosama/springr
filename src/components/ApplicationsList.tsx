"use client";

import { useEffect, useState } from "react";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { Application, ApplicationStatus, Lang } from "@/lib/types";

const STATUSES: ApplicationStatus[] = ["a_postuler", "envoyee", "entretien", "refusee", "acceptee"];

export default function ApplicationsList({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const a = t.apps;
  const [apps, setApps] = useState<Application[] | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => setApps(store.getApps()), []);

  function update(i: number, patch: Partial<Application>) {
    if (!apps) return;
    const next = apps.map((x, j) => (j === i ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x));
    setApps(next);
    store.setApps(next);
  }

  function remove(i: number) {
    if (!apps) return;
    const next = apps.filter((_, j) => j !== i);
    setApps(next);
    store.setApps(next);
  }

  if (!apps) return null;
  return (
    <div>
      <h1>{a.title}</h1>
      {apps.length === 0 && <p className="empty">{a.empty}</p>}
      <ul className="apps">
        {apps.map((x, i) => {
          const due = x.remindAt && x.remindAt <= today && !["refusee", "acceptee"].includes(x.status);
          return (
            <li key={x.offer.id} className={due ? "app due" : "app"}>
              <div>
                <a href={x.offer.url} target="_blank" rel="noreferrer"><strong>{x.offer.title}</strong></a>
                <p className="muted">{x.offer.company} · {x.offer.city}</p>
                {due && <span className="tag warn">{a.due}</span>}
              </div>
              <div className="app-controls">
                <select value={x.status} onChange={(e) => update(i, { status: e.target.value as ApplicationStatus })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{t.status[s]}</option>)}
                </select>
                <label className="small">{a.remind}
                  <input type="date" value={x.remindAt ?? ""} onChange={(e) => update(i, { remindAt: e.target.value })} />
                </label>
                <button className="btn small" onClick={() => remove(i)}>{a.remove}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
