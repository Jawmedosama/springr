"use client";

import { useState } from "react";
import { getDict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

const MAIL = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL;

/** Rien n'est enregistré dans la base : l'avis part par e-mail, ou dans les journaux du site. */
export default function Feedback({ lang }: { lang: Lang }) {
  const f = getDict(lang).feedback;
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (MAIL) window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(f.title)}&body=${encodeURIComponent(text)}`;
    else await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang }) }).catch(() => null);
    setDone(true);
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>{f.title}</h1>
        <p>{f.lead}</p>
      </div>
      {done ? (
        <p className="banner ok">{f.thanks}</p>
      ) : (
        <form className="panel" onSubmit={send}>
          <label>{f.label}<textarea rows={6} maxLength={1500} value={text} onChange={(e) => setText(e.target.value)} /></label>
          <p className="muted small" style={{ margin: 0 }}>{f.privacy}</p>
          <button className="btn dark" type="submit">{f.send}</button>
        </form>
      )}
    </main>
  );
}
