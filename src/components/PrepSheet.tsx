"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { emailInOffer } from "@/lib/accessible";
import { downloadFile, loadCvFile, mailForOffer } from "@/lib/applyMail";
import { cityLabel } from "@/lib/belgium";
import type { Dict } from "@/lib/i18n";
import { FOLLOW_UP_DAYS, inDays, store } from "@/lib/store";
import type { Lang, Offer, Profile } from "@/lib/types";
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

/** Tout ce qu'il faut pour postuler à une offre : mail type, CV et lien vers l'annonce. */
export default function PrepSheet({ offer, profile, lang, t, spontaneous, onClose, onSaved }: Props) {
  const p = t.prep;
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [mail, setMail] = useState(false);
  const [mailCopied, setMailCopied] = useState(false);
  const [aiOn, setAiOn] = useState(false);
  const [interview, setInterview] = useState<string | null>(null);
  const [interviewBusy, setInterviewBusy] = useState(false);

  useEffect(() => {
    loadCvFile().then((f) => setCvFile(f ?? null));
    fetch("/api/interview")
      .then((r) => r.json() as Promise<{ enabled: boolean }>)
      .then((d) => setAiOn(d.enabled))
      .catch(() => setAiOn(false));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function save(sent: boolean) {
    store.saveOffer(offer, {
      spontaneous,
      ...(sent ? { status: "envoyee" as const, remindAt: inDays(FOLLOW_UP_DAYS) } : {}),
    });
    onSaved?.();
    onClose();
  }

  async function prepareInterview() {
    setInterviewBusy(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: offer.title, company: offer.company, description: offer.description, lang }),
      });
      const d = (await res.json()) as { text?: string };
      setInterview(d.text ?? p.interviewError);
    } catch {
      setInterview(p.interviewError);
    }
    setInterviewBusy(false);
  }

  function copyMail() {
    const m = mailForOffer(offer, profile, lang);
    navigator.clipboard?.writeText(`${m.subject}\n\n${m.body}`);
    setMailCopied(true);
    setTimeout(() => setMailCopied(false), 1500);
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

        <div className="sheet-actions" style={{ alignItems: "center" }}>
          {cvFile ? (
            <>
              <span>{p.myCv} : <b>{cvFile.name}</b></span>
              <button className="btn small" onClick={() => downloadFile(cvFile)}>{p.downloadCv}</button>
            </>
          ) : (
            <>
              <Link href={`/${lang}/profil`}>{p.addCv}</Link>
              <Link href={`/${lang}/cv`}>{t.cvBuilder.open}</Link>
            </>
          )}
        </div>

        <div className="sheet-actions">
          <button className="btn small" onClick={copyMail}>{mailCopied ? p.copied : t.applyMail.copyMail}</button>
          {aiOn && !spontaneous && (
            <button className="btn small" onClick={prepareInterview} disabled={interviewBusy}>
              {interviewBusy ? p.interviewBusy : p.interview}
            </button>
          )}
        </div>
        {interview && <p style={{ whiteSpace: "pre-wrap" }}>{interview}</p>}

        <div className="sheet-actions" style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
          {offer.url && offer.url !== "#" && (
            <a className="btn dark" href={offer.url} target="_blank" rel="noreferrer">{p.openOffer}</a>
          )}
          {emailInOffer(offer) && <button className="btn" onClick={() => setMail(true)}>{t.applyMail.button}</button>}
          <button className="btn" onClick={() => save(false)}>{p.save}</button>
          <button className="btn brand" onClick={() => save(true)}>{p.sent}</button>
        </div>
      </div>
      {mail && <EmailApply offer={offer} profile={profile} lang={lang} t={t} onClose={() => setMail(false)} onSent={onSaved} />}
    </div>
  );
}
