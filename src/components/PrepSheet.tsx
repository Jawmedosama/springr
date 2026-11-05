"use client";

import { useEffect, useState } from "react";
import { emailInOffer, printAsPdf } from "@/lib/accessible";
import Link from "next/link";
import { downloadFile, loadCvFile, mailForOffer } from "@/lib/applyMail";
import { cityLabel } from "@/lib/belgium";
import type { Dict } from "@/lib/i18n";
import { FOLLOW_UP_DAYS, inDays, store } from "@/lib/store";
import { toAiProfile, type Lang, type Offer, type Profile } from "@/lib/types";
import EmailApply from "./EmailApply";

interface Props {
  offer: Offer;
  profile: Profile;
  lang: Lang;
  t: Dict;
  spontaneous?: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PrepSheet({ offer, profile, lang, t, spontaneous, onClose, onSaved }: Props) {
  const p = t.prep;
  const existing = store.getApps().find((a) => a.offer.id === offer.id);
  const [text, setText] = useState(existing?.letter ?? "");
  const [ai, setAi] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [mail, setMail] = useState(false);
  const [mailCopied, setMailCopied] = useState(false);

  async function generate() {
    setBusy(true);
    const r = await fetch("/api/letter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ offer, profile: toAiProfile(profile), lang, spontaneous }),
    })
      .then((x) => x.json() as Promise<{ letter?: string; ai: boolean }>)
      .catch(() => null);
    if (r) {
      setText(r.letter ?? "");
      setAi(r.ai);
    }
    setBusy(false);
  }

  useEffect(() => {
    if (!text) void generate();
    loadCvFile().then((f) => setCvFile(f ?? null));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save(sent: boolean) {
    store.saveOffer(offer, {
      letter: text,
      spontaneous,
      ...(sent ? { status: "envoyee" as const, remindAt: inDays(FOLLOW_UP_DAYS) } : {}),
    });
    onSaved?.();
    onClose();
  }

  function copyMail() {
    const m = mailForOffer(offer, profile, lang);
    navigator.clipboard?.writeText(`${m.subject}\n\n${m.body}`);
    setMailCopied(true);
    setTimeout(() => setMailCopied(false), 1500);
  }

  function download() {
    const name = `lettre-${offer.company || "springr"}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={p.title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <span className="tag">{spontaneous ? p.spontaneous : t.contracts[offer.contract]}</span>
            <h2 style={{ marginTop: 10 }}>{spontaneous ? offer.company : offer.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{spontaneous ? cityLabel(offer.city, lang) : `${offer.company} · ${cityLabel(offer.city, lang)}`}</p>
          </div>
          <button className="close" onClick={onClose} aria-label={t.offers.close}>✕</button>
        </div>

        <h3 style={{ margin: 0 }}>{p.letter}</h3>

        {busy ? (
          <div className="skeleton" style={{ height: 300, borderRadius: 14 }} aria-label={p.loading} />
        ) : (
          <textarea
            className="doc"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
          />
        )}
        <p className="muted small" style={{ margin: 0 }}>
          {ai === true ? p.ai : ai === false ? p.noAi : ""} {p.privacy}
        </p>

        <div className="sheet-actions">
          <button className="btn small" onClick={generate} disabled={busy}>{busy ? p.loading : text ? p.regenerate : p.generate}</button>
          <button
            className="btn small"
            disabled={!text}
            onClick={() => {
              navigator.clipboard?.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? p.copied : p.copy}
          </button>
          <button className="btn small" disabled={!text} onClick={download}>{p.download}</button>
          <button className="btn small" onClick={copyMail}>{mailCopied ? p.copied : t.applyMail.copyMail}</button>
          <button className="btn small" disabled={!text} onClick={() => printAsPdf(`${p.letter} - ${profile.firstName} ${profile.lastName}`, text)}>{p.pdf}</button>
        </div>

        <div className="sheet-actions" style={{ alignItems: "center" }}>
          {cvFile ? (
            <>
              <span>{p.myCv} : <b>{cvFile.name}</b></span>
              <button className="btn small" onClick={() => downloadFile(cvFile)}>{p.downloadCv}</button>
            </>
          ) : (
            <Link href={`/${lang}/profil`}>{p.addCv}</Link>
          )}
        </div>

        <div className="sheet-actions" style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
          {offer.url && offer.url !== "#" && (
            <a className="btn" href={offer.url} target="_blank" rel="noreferrer">{p.openOffer}</a>
          )}
          {emailInOffer(offer) && <button className="btn dark" onClick={() => setMail(true)}>{t.applyMail.button}</button>}
          <button className="btn" onClick={() => save(false)}>{p.save}</button>
          <button className="btn brand" onClick={() => save(true)}>{p.sent}</button>
        </div>
      </div>
      {mail && <EmailApply offer={offer} profile={profile} lang={lang} t={t} onClose={() => setMail(false)} onSent={onSaved} />}
    </div>
  );
}
