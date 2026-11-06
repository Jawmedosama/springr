"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase";
import type { Lang } from "@/lib/types";
import PasswordField, { MIN_PASSWORD } from "./PasswordField";

/** Arrivée depuis l'e-mail « mot de passe oublié », ou depuis le profil une fois connecté. */
export default function NewPassword({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const w = t.pw;
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return setReady(false);
    sb.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) return setError(w.rule);
    if (password !== confirm) return setError(w.mismatch);
    setBusy(true);
    setError("");
    const r = await getSupabase()?.auth.updateUser({ password });
    setBusy(false);
    if (r?.error) setError(r.error.code === "same_password" ? w.same : r.error.code === "weak_password" ? w.rule : w.failed);
    else window.location.href = `/${lang}/profil`;
  }

  return (
    <main className="page">
      <div className="page-head"><h1>{w.resetTitle}</h1></div>
      {ready === false && (
        <div className="empty">
          <p style={{ margin: 0 }}>{w.resetExpired}</p>
          <Link className="btn dark" href={`/${lang}/connexion`}>{t.start.login}</Link>
        </div>
      )}
      {ready && (
        <form className="panel" onSubmit={save}>
          <PasswordField t={t} label={w.password} value={password} onChange={setPassword} create />
          <PasswordField t={t} label={w.confirm} value={confirm} onChange={setConfirm} />
          {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
          <button className="btn dark" type="submit" disabled={busy}>{busy ? w.busy : w.resetGo}</button>
        </form>
      )}
    </main>
  );
}
