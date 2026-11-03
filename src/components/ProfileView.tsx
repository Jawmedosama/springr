"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { deleteAccount, signOut } from "@/lib/sync";
import type { Lang, Profile } from "@/lib/types";
import { initials } from "./OfferCard";

export default function ProfileView({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = t.profile;
  const s = t.signup;
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [account, setAccount] = useState<string | null>(null);
  const canLogin = Boolean(getSupabase());

  useEffect(() => {
    setProfile(store.getProfile());
    getSupabase()?.auth.getSession().then(({ data }) => setAccount(data.session?.user.email ?? null));
  }, []);

  if (profile === undefined) return <main className="page" />;
  if (!profile)
    return (
      <main className="page">
        <div className="page-head"><h1>{p.title}</h1></div>
        <div className="empty">
          <p style={{ margin: 0 }}>{p.none}</p>
          <Link className="btn dark" href={`/${lang}/inscription`}>{p.create}</Link>
          {canLogin && <Link className="btn" href={`/${lang}/connexion`}>{t.auth.haveAccount}</Link>}
        </div>
      </main>
    );

  async function erase() {
    if (!window.confirm(account ? t.auth.deleteConfirm : p.eraseConfirm)) return;
    if (account) await deleteAccount();
    else store.clearAll();
    setAccount(null);
    setProfile(null);
  }

  async function logout() {
    await signOut();
    setAccount(null);
    setProfile(null);
  }

  return (
    <main className="page">
      <div className="page-head" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span className="avatar" style={{ width: 64, height: 64, fontSize: "1.4rem", borderRadius: 20 }}>
          {initials(`${profile.firstName} ${profile.lastName}`)}
        </span>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>{profile.firstName} {profile.lastName}</h1>
          <p>{profile.email}</p>
        </div>
        <Link className="btn" href={`/${lang}/inscription`}>{p.edit}</Link>
      </div>

      <div className="form">
        {canLogin && (
          <section className="panel">
            <h3>{t.auth.account}</h3>
            {account ? (
              <>
                <p className="muted" style={{ margin: 0 }}>{t.auth.connected} {account}. {t.auth.synced}</p>
                <div><button className="btn small" onClick={logout}>{t.auth.logout}</button></div>
              </>
            ) : (
              <>
                <p className="muted" style={{ margin: 0 }}>{t.auth.saveText}</p>
                <div><Link className="btn dark small" href={`/${lang}/connexion`}>{t.auth.save}</Link></div>
              </>
            )}
          </section>
        )}

        <section className="panel">
          <h3>{p.residence}</h3>
          <dl className="dl">
            <dt>{s.address}</dt>
            <dd>{profile.street} {profile.number}, {profile.postcode} {profile.city}</dd>
            <dt>{p.region}</dt>
            <dd>{t.regions[profile.region]}</dd>
            <dt>{p.declaration}</dt>
            <dd>{profile.declaredResident ? `✓ ${p.verified}` : "—"}</dd>
          </dl>
        </section>

        <section className="panel">
          <h3>{p.search}</h3>
          <dl className="dl">
            <dt>{s.field.split(" (")[0]}</dt>
            <dd>{profile.field || "—"}</dd>
            <dt>{s.studyLevel}</dt>
            <dd>{profile.studyLevel}</dd>
            <dt>{s.contracts}</dt>
            <dd>
              <div className="chips">{profile.contracts.map((c) => <span className="tag" key={c}>{t.contracts[c]}</span>)}</div>
            </dd>
            <dt>{s.skills.split(" (")[0]}</dt>
            <dd>{profile.skills.join(", ") || "—"}</dd>
            <dt>{s.languages}</dt>
            <dd>{profile.languages.join(", ") || "—"}</dd>
            <dt>{s.mobility.split(" (")[0]}</dt>
            <dd>{profile.mobilityKm} {p.km}</dd>
          </dl>
        </section>

        <section className="panel">
          <h3>{p.cv}</h3>
          {profile.cvText ? <pre className="cv-preview">{profile.cvText}</pre> : <p className="muted" style={{ margin: 0 }}>{p.cvEmpty}</p>}
        </section>

        <section className="panel">
          <h3>{p.data}</h3>
          <p className="muted" style={{ margin: 0 }}>{account ? t.auth.dataText : p.dataText}</p>
          <div><button className="btn small" onClick={erase} style={{ color: "var(--bad)" }}>{p.erase}</button></div>
        </section>
      </div>
    </main>
  );
}
