"use client";

import { useEffect, useState } from "react";
import { emailInOffer } from "@/lib/accessible";
import { downloadFile, fillTemplate, loadCvFile, loadTemplate } from "@/lib/applyMail";
import type { Dict } from "@/lib/i18n";
import { FOLLOW_UP_DAYS, inDays, store } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import type { Lang, Offer, Profile } from "@/lib/types";

interface Props {
  offer: Offer;
  profile: Profile;
  lang: Lang;
  t: Dict;
  onClose: () => void;
  onSent?: () => void;
}

/** Aperçu de l'e-mail : rien ne part sans un clic sur Envoyer. */
export default function EmailApply({ offer, profile, lang, t, onClose, onSent }: Props) {
  const m = t.applyMail;
  const to = emailInOffer(offer) ?? "";
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [cv, setCv] = useState<File | null | undefined>(undefined);
  const [direct, setDirect] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "opened" | "error">("idle");

  useEffect(() => {
    const tpl = loadTemplate(lang);
    setSubject(fillTemplate(tpl.subject, offer, profile));
    const signature = profile.phone ? `\n${profile.phone}` : "";
    setBody(fillTemplate(tpl.body, offer, profile) + signature);
    loadCvFile().then((f) => setCv(f ?? null));
    fetch("/api/apply-email")
      .then((r) => r.json() as Promise<{ enabled: boolean }>)
      .then((d) => setDirect(d.enabled))
      .catch(() => setDirect(false));
  }, [lang, offer, profile]);

  function markSent() {
    store.saveOffer(offer, { status: "envoyee", letter: body, remindAt: inDays(FOLLOW_UP_DAYS) });
    onSent?.();
    onClose();
  }

  async function send() {
    if (!cv) return;
    setState("busy");
    const { data } = (await getSupabase()?.auth.getSession()) ?? { data: { session: null } };
    const form = new FormData();
    form.set("to", to);
    form.set("subject", subject);
    form.set("body", body);
    form.set("offerId", offer.id);
    form.set("cv", cv);
    const res = await fetch("/api/apply-email", {
      method: "POST",
      headers: { authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: form,
    }).catch(() => null);
    if (res?.ok) markSent();
    else setState("error");
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
        {state === "error" && <p className="error" role="alert">{m.failed}</p>}
        {direct ? (
          <button className="btn brand block" disabled={!cv || state === "busy"} onClick={send}>
            {state === "busy" ? m.sending : m.send}
          </button>
        ) : state === "opened" ? (
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
