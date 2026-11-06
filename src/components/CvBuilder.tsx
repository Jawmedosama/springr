"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { downloadFile, saveCvFile } from "@/lib/applyMail";
import { makeCvPdf, type CvExtra, type CvTemplate } from "@/lib/cvPdf";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { Lang, Profile } from "@/lib/types";

const KEY = "springr.cvExtra";

export default function CvBuilder({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const c = t.cvBuilder;
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [extra, setExtra] = useState<CvExtra>({ summary: "", experience: "", education: "" });
  const [template, setTemplate] = useState<CvTemplate>("classique");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(store.getProfile());
    try {
      setExtra((e) => ({ ...e, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<CvExtra>) }));
    } catch {
      /* stockage indisponible */
    }
  }, []);

  function change(k: keyof CvExtra, value: string) {
    const next = { ...extra, [k]: value };
    setExtra(next);
    setSaved(false);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* stockage indisponible */
    }
  }

  if (profile === undefined) return <main className="page" />;
  if (!profile)
    return (
      <main className="page">
        <div className="page-head"><h1>{c.title}</h1></div>
        <div className="empty">
          <p style={{ margin: 0 }}>{t.profile.none}</p>
          <Link className="btn dark" href={`/${lang}/inscription`}>{t.profile.create}</Link>
        </div>
      </main>
    );

  return (
    <main className="page">
      <div className="page-head">
        <h1>{c.title}</h1>
        <p>{c.lead}</p>
      </div>
      <div className="form">
        <section className="panel">
          <div className="filters" role="radiogroup" aria-label={c.template}>
            {(["classique", "moderne"] as const).map((k) => (
              <button key={k} role="radio" aria-checked={template === k} className={template === k ? "chip on" : "chip"} onClick={() => setTemplate(k)}>{c.templates[k]}</button>
            ))}
          </div>
          <label>{c.summary}<textarea rows={3} placeholder={c.summaryHint} value={extra.summary} onChange={(e) => change("summary", e.target.value)} /></label>
          <label>{c.experience}<textarea rows={6} placeholder={c.experienceHint} value={extra.experience} onChange={(e) => change("experience", e.target.value)} /></label>
          <label>{c.education}<textarea rows={3} placeholder={c.educationHint} value={extra.education} onChange={(e) => change("education", e.target.value)} /></label>
          <p className="muted small" style={{ margin: 0 }}>{c.note}</p>
          <div className="sheet-actions">
            <button className="btn dark" onClick={async () => downloadFile(await makeCvPdf(profile, extra, template, lang))}>{c.download}</button>
            <button
              className="btn"
              onClick={async () => {
                await saveCvFile(await makeCvPdf(profile, extra, template, lang));
                setSaved(true);
              }}
            >
              {saved ? c.saved : c.use}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
