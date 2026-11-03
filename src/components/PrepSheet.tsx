"use client";

import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { FOLLOW_UP_DAYS, inDays, store } from "@/lib/store";
import { toAiProfile, type Lang, type Offer, type Profile } from "@/lib/types";

type Kind = "letter" | "cv";

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
  const [tab, setTab] = useState<Kind>("letter");
  const [docs, setDocs] = useState<Record<Kind, string>>({ letter: existing?.letter ?? "", cv: existing?.cv ?? "" });
  const [ai, setAi] = useState<Record<Kind, boolean | null>>({ letter: null, cv: null });
  const [busy, setBusy] = useState<Kind | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate(kind: Kind) {
    setBusy(kind);
    const r = await fetch(kind === "letter" ? "/api/letter" : "/api/cv", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ offer, profile: toAiProfile(profile), lang, spontaneous }),
    })
      .then((x) => x.json() as Promise<{ letter?: string; cv?: string; ai: boolean }>)
      .catch(() => null);
    if (r) {
      setDocs((d) => ({ ...d, [kind]: (kind === "letter" ? r.letter : r.cv) ?? "" }));
      setAi((a) => ({ ...a, [kind]: r.ai }));
    }
    setBusy(null);
  }

  useEffect(() => {
    if (!docs.letter) generate("letter");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "cv" && !docs.cv && busy !== "cv") generate("cv");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function save(sent: boolean) {
    store.saveOffer(offer, {
      letter: docs.letter,
      cv: docs.cv,
      spontaneous,
      ...(sent ? { status: "envoyee" as const, remindAt: inDays(FOLLOW_UP_DAYS) } : {}),
    });
    onSaved?.();
    onClose();
  }

  function download() {
    const name = `${tab === "letter" ? "lettre" : "cv"}-${offer.company || "springr"}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const url = URL.createObjectURL(new Blob([docs[tab]], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const text = docs[tab];
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={p.title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <span className="tag">{spontaneous ? p.spontaneous : t.contracts[offer.contract]}</span>
            <h2 style={{ marginTop: 10 }}>{spontaneous ? offer.company : offer.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{spontaneous ? offer.city : `${offer.company} · ${offer.city}`}</p>
          </div>
          <button className="close" onClick={onClose} aria-label={t.offers.close}>✕</button>
        </div>

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "letter"} className={tab === "letter" ? "on" : ""} onClick={() => setTab("letter")}>{p.letter}</button>
          <button role="tab" aria-selected={tab === "cv"} className={tab === "cv" ? "on" : ""} onClick={() => setTab("cv")}>{p.cv}</button>
        </div>

        {!profile.cvText && <p className="banner">{p.noCv}</p>}

        {busy === tab ? (
          <div className="skeleton" style={{ height: 300, borderRadius: 14 }} aria-label={p.loading} />
        ) : (
          <textarea
            className="doc"
            value={text}
            onChange={(e) => setDocs((d) => ({ ...d, [tab]: e.target.value }))}
            rows={14}
          />
        )}
        <p className="muted small" style={{ margin: 0 }}>
          {ai[tab] === true ? p.ai : ai[tab] === false ? p.noAi : ""} {p.privacy}
        </p>

        <div className="sheet-actions">
          <button className="btn small" onClick={() => generate(tab)} disabled={busy !== null}>{busy === tab ? p.loading : text ? p.regenerate : p.generate}</button>
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
        </div>

        <div className="sheet-actions" style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
          {offer.url && offer.url !== "#" && (
            <a className="btn" href={offer.url} target="_blank" rel="noreferrer">{p.openOffer}</a>
          )}
          <button className="btn" onClick={() => save(false)}>{p.save}</button>
          <button className="btn brand" onClick={() => save(true)}>{p.sent}</button>
        </div>
      </div>
    </div>
  );
}
