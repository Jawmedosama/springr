"use client";

import { useEffect, useState } from "react";
import { getDict } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase";
import type { Lang } from "@/lib/types";
import AuthForm, { type AuthMode } from "./AuthForm";

export default function LoginForm({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const [mode, setMode] = useState<AuthMode>("login");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setConfirmed(new URLSearchParams(window.location.search).has("confirmed"));
    // Le lien de confirmation connecte aussi : on passe alors directement au profil.
    getSupabase()?.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = `/${lang}/profil`;
    });
  }, [lang]);

  return (
    <main className="page">
      <div className="page-head">
        <h1>{t.auth.title}</h1>
        <p>{t.auth.lead}</p>
      </div>
      {!getSupabase() ? (
        <p className="banner">{t.auth.unavailable}</p>
      ) : (
        <div className="panel">
          {confirmed && <p className="banner ok" style={{ margin: 0 }}>{t.pw.confirmed}</p>}
          <AuthForm lang={lang} mode={mode} onMode={setMode} />
          <p className="muted small" style={{ margin: 0 }}>{t.auth.note}</p>
        </div>
      )}
    </main>
  );
}
