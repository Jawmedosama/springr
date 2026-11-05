"use client";

import { useEffect, useState } from "react";
import { emailInOffer } from "@/lib/accessible";
import { downloadFile, loadCvFile, mailForOffer } from "@/lib/applyMail";
import type { Dict } from "@/lib/i18n";
import { FOLLOW_UP_DAYS, inDays, store } from "@/lib/store";
import type { Lang, Offer, Profile } from "@/lib/types";

interface Props {
  offer: Offer;
  profile: Profile;
  lang: Lang;
  t: Dict;
  onClose: () => void;
  onSent?: () => void;
}

/** Aperçu de l'e-mail : c'est la personne qui l'envoie depuis sa propre messagerie. */
export default function EmailApply({ offer, profile, lang, t, onClose, onSent }: Props) {
  const m = t.applyMail;
  const to = emailInOffer(offer) ?? "";
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [cv, setCv] = useState<File | null | undefined>(undefined);
  const [state, setState] = useState<"idle" | "opened">("idle");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const mail = mailForOffer(offer, profile, lang);
    setSubject(mail.subject);
    setBody(mail.body);
    loadCvFile().then((f) => setCv(f ?? null));
  }, [lang, offer, profile]);

  function markSent() {
    store.saveOffer(offer, { status: "envoyee", letter: body, remindAt: inDays(FOLLOW_UP_DAYS) });
    onSent?.();
    onClose();
  }

  function copy(label: string, text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={m.title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h2>{m.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{offer.title} · {offer.company}</p>
          </div>
          <button className="close" onClick={onClose} aria-label={t.offers.close}>✕</button>
        </div>
        <label>{m.to}<input value={to} readOnly /></label>
        <label>{m.subject}<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
        <label>{m.body}<textarea rows={9} value={body} onChange={(e) => setBody(e.target.value)} /></label>
        <p style={{ margin: 0 }}>
          {m.attachment} : {cv ? <b>{cv.name}</b> : <span className="error">{m.noCv}</span>}
        </p>
        <div className="sheet-actions">
          <button className="btn small" onClick={() => copy("subject", subject)}>{copied === "subject" ? t.prep.copied : m.copySubject}</button>
          <button className="btn small" onClick={() => copy("body", body)}>{copied === "body" ? t.prep.copied : m.copyBody}</button>
        </div>
        {state === "opened" ? (
          <>
            <p className="banner">{m.attachHint}</p>
            <button className="btn brand block" onClick={markSent}>{m.confirm}</button>
          </>
        ) : (
          <>
            <p className="muted small" style={{ margin: 0 }}>{m.manual}</p>
            <a
              className="btn brand block"
              href={mailto}
              onClick={() => {
                if (cv) downloadFile(cv);
                setState("opened");
              }}
            >
              {m.open}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
