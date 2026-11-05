"use client";

import { useEffect, useState } from "react";
import { loadCvFile, loadTemplate, removeCvFile, resetTemplate, saveCvFile, saveTemplate, type MailTemplate } from "@/lib/applyMail";
import type { Dict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

/** Mail de candidature et CV en PDF, gardés dans ce navigateur. */
export default function MailSettings({ t, lang }: { t: Dict; lang: Lang }) {
  const m = t.applyMail;
  const [tpl, setTpl] = useState<MailTemplate>({ subject: "", body: "" });
  const [cvName, setCvName] = useState<string | null>(null);
  const [tooBig, setTooBig] = useState(false);

  useEffect(() => {
    setTpl(loadTemplate(lang));
    loadCvFile().then((f) => setCvName(f?.name ?? null));
  }, [lang]);

  function change(next: MailTemplate) {
    setTpl(next);
    saveTemplate(next);
  }

  async function addCv(file?: File) {
    if (!file) return;
    setTooBig(file.size > 4 * 1024 * 1024);
    if (file.size > 4 * 1024 * 1024) return;
    await saveCvFile(file);
    setCvName(file.name);
  }

  return (
    <section className="panel">
      <h3>{m.settings}</h3>
      <p className="muted" style={{ margin: 0 }}>{m.settingsHint}</p>
      <label>{m.subject}<input value={tpl.subject} onChange={(e) => change({ ...tpl, subject: e.target.value })} /></label>
      <label>{m.body}<textarea rows={9} value={tpl.body} onChange={(e) => change({ ...tpl, body: e.target.value })} /></label>
      <div><button type="button" className="link-btn small" onClick={() => setTpl(resetTemplate(lang))}>{m.reset}</button></div>
      <div className="chips" style={{ alignItems: "center" }}>
        <span>{m.attachment} : <b>{cvName ?? m.noCvShort}</b></span>
        <label className="btn small file-btn">
          {cvName ? t.signup.import.replace : m.addCv}
          <input type="file" accept=".pdf,application/pdf" className="file-input" onChange={(e) => addCv(e.target.files?.[0])} />
        </label>
        {cvName && (
          <button type="button" className="btn small ghost" onClick={() => { void removeCvFile(); setCvName(null); }}>{t.apps.remove}</button>
        )}
      </div>
      {tooBig && <p className="error" role="alert">{m.tooBig}</p>}
    </section>
  );
}
