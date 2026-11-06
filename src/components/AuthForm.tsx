"use client";

import { useState } from "react";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import type { Lang } from "@/lib/types";
import PasswordField, { MIN_PASSWORD } from "./PasswordField";

export type AuthMode = "login" | "signup";

/** Connexion et création de compte : adresse e-mail et mot de passe. */
export default function AuthForm({ lang, mode, onMode }: { lang: Lang; mode: AuthMode; onMode: (m: AuthMode) => void }) {
  const t = getDict(lang);
  const w = t.pw;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [done, setDone] = useState(false);

  const address = email.trim();
  const confirmUrl = () => `${window.location.origin}/${lang}/connexion?confirmed=1`;

  function explain(e: { code?: string; status?: number }): string {
    if (e.status === 429 || e.code?.startsWith("over_")) return w.limited;
    if (e.code === "invalid_credentials") return w.invalid;
    if (e.code === "email_not_confirmed") return w.unconfirmed;
    if (e.code === "weak_password") return w.rule;
    if (e.code === "user_already_exists") return w.exists;
    return w.failed;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    setUnconfirmed(false);
    await action().catch(() => setError(w.failed));
    setBusy(false);
  }

  const login = () =>
    run(async () => {
      const sb = getSupabase();
      const r = await sb?.auth.signInWithPassword({ email: address, password });
      if (r?.error) {
        setError(explain(r.error));
        setUnconfirmed(r.error.code === "email_not_confirmed");
      } else if (r) window.location.href = `/${lang}/${store.getProfile() ? "offres" : "profil"}`;
    });

  const signup = () =>
    run(async () => {
      if (password.length < MIN_PASSWORD) return setError(w.rule);
      if (password !== confirm) return setError(w.mismatch);
      const r = await getSupabase()?.auth.signUp({ email: address, password, options: { emailRedirectTo: confirmUrl() } });
      if (r?.error) return setError(explain(r.error));
      // Par sécurité, Supabase répond sans erreur pour une adresse déjà utilisée : la liste d'identités est alors vide.
      if (r?.data.user?.identities?.length === 0) return setError(w.exists);
      setDone(true);
    });

  const forgot = () =>
    run(async () => {
      if (!address) return setError(w.needEmail);
      const r = await getSupabase()?.auth.resetPasswordForEmail(address, { redirectTo: `${window.location.origin}/${lang}/nouveau-mot-de-passe` });
      if (r?.error) setError(explain(r.error));
      else setNotice(w.resetSent);
    });

  const resend = () =>
    run(async () => {
      const r = await getSupabase()?.auth.resend({ type: "signup", email: address, options: { emailRedirectTo: confirmUrl() } });
      if (r?.error) setError(explain(r.error));
      else setNotice(w.resent);
    });

  if (done) return <p className="banner ok" style={{ margin: 0 }}>{w.confirmSent}</p>;

  return (
    <form
      style={{ display: "grid", gap: 12 }}
      onSubmit={(e) => {
        e.preventDefault();
        void (mode === "login" ? login() : signup());
      }}
    >
      <label>{t.auth.email}
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <PasswordField t={t} label={w.password} value={password} onChange={setPassword} create={mode === "signup"} />
      {mode === "signup" && <PasswordField t={t} label={w.confirm} value={confirm} onChange={setConfirm} />}
      {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
      {notice && <p className="banner ok" style={{ margin: 0 }}>{notice}</p>}
      {unconfirmed && <button type="button" className="btn small" disabled={busy} onClick={resend}>{w.resend}</button>}
      <button className="btn dark block" type="submit" disabled={busy}>{busy ? w.busy : mode === "login" ? t.start.login : w.create}</button>
      {mode === "login" && <button type="button" className="link-btn" disabled={busy} onClick={forgot}>{w.forgot}</button>}
      <button type="button" className="link-btn" onClick={() => onMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? w.toSignup : w.toLogin}</button>
    </form>
  );
}
