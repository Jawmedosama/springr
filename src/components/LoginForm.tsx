"use client";

import { useEffect, useState } from "react";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import type { Lang } from "@/lib/types";

export default function LoginForm({ lang }: { lang: Lang }) {
  const t = getDict(lang).auth;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  useEffect(() => setEmail(store.getProfile()?.email ?? ""), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !email.trim()) return;
    setState("busy");
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/${lang}/profil` },
    });
    setState(error ? "error" : "sent");
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>{t.title}</h1>
        <p>{t.lead}</p>
      </div>
      {!getSupabase() ? (
        <p className="banner">{t.unavailable}</p>
      ) : state === "sent" ? (
        <p className="banner ok">{t.sent}</p>
      ) : (
        <form className="panel" onSubmit={submit}>
          <label>{t.email}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          {state === "error" && <p className="error" role="alert">{t.error}</p>}
          <button className="btn dark" type="submit" disabled={state === "busy"}>{state === "busy" ? t.sending : t.send}</button>
          <p className="muted small" style={{ margin: 0 }}>{t.note}</p>
        </form>
      )}
    </main>
  );
}
