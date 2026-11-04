"use client";

import { useState } from "react";
import { parseCv, readCvFile, type CvFields } from "@/lib/cvParse";
import type { Dict } from "@/lib/i18n";

/** Coordonnées lues dans le navigateur ; seul le reste du CV, nettoyé, part à l'IA. */
function withoutContact(text: string, f: CvFields): string {
  return [f.firstName, f.lastName, f.email, f.phone, f.street, f.city]
    .filter((x): x is string => Boolean(x))
    .reduce((t, x) => t.split(x).join(" "), text);
}

export default function CvImport({ t, onResult }: { t: Dict; onResult: (f: CvFields, text: string) => void }) {
  const c = t.signup.import;
  const [state, setState] = useState<"idle" | "busy" | "done" | "empty">("idle");
  const [pasted, setPasted] = useState("");
  const [aiOk, setAiOk] = useState(false);

  async function analyse(text: string) {
    if (text.trim().length < 30) {
      setState("empty");
      return;
    }
    const local = parseCv(text);
    // Sans accord, tout reste dans le navigateur.
    const res = aiOk
      ? await fetch("/api/cv-parse", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: withoutContact(text, local) }),
        })
          .then((r) => r.json() as Promise<{ fields?: CvFields }>)
          .catch(() => null)
      : null;
    const ai = res?.fields ?? {};
    onResult(
      {
        ...local,
        field: ai.field || local.field,
        studyLevel: ai.studyLevel ?? local.studyLevel,
        skills: ai.skills?.length ? ai.skills : local.skills,
        languages: ai.languages?.length ? ai.languages : local.languages,
      },
      text.trim(),
    );
    setState("done");
  }

  async function onFile(file?: File) {
    if (!file) return;
    setState("busy");
    await analyse(await readCvFile(file).catch(() => ""));
  }

  return (
    <section className="panel cv-hero">
      <h3>{c.title}</h3>
      {state === "done" ? (
        <p className="banner ok" style={{ margin: 0 }}>{c.done}</p>
      ) : (
        <>
          <p className="muted" style={{ margin: 0 }}>{c.lead}</p>
          <label className="check">
            <input type="checkbox" checked={aiOk} onChange={(e) => setAiOk(e.target.checked)} />
            {c.consent}
          </label>
          <label className="btn dark big block">
            {state === "busy" ? c.busy : c.button}
            <input type="file" accept=".pdf,.docx,.txt" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {state === "empty" && <p className="error" role="alert">{c.empty}</p>}
          <details>
            <summary className="small muted" style={{ cursor: "pointer" }}>{c.paste}</summary>
            <textarea rows={6} value={pasted} onChange={(e) => setPasted(e.target.value)} style={{ marginTop: 8 }} />
            <button type="button" className="btn small" style={{ marginTop: 8 }} onClick={() => { setState("busy"); void analyse(pasted); }}>{c.analyse}</button>
          </details>
          <p className="muted small" style={{ margin: 0 }}>{c.privacy}</p>
        </>
      )}
    </section>
  );
}
