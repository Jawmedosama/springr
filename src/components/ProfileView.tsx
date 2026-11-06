"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { store } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { deleteAccount, signOut } from "@/lib/sync";
import type { Lang, Profile } from "@/lib/types";
import { loadTemplate, removeCvFile, resetTemplate } from "@/lib/applyMail";
import MailSettings from "./MailSettings";
import SyncStatus from "./SyncStatus";
import { initials } from "./OfferCard";

export default function ProfileView({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = t.profile;
  const s = t.signup;
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [account, setAccount] = useState<string | null>(null);
  const canLogin = Boolean(getSupabase());
  const [tasteReset, setTasteReset] = useState(false);

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
    resetTemplate(lang);
    await removeCvFile();
    setAccount(null);
    setProfile(null);
  }

  function exportData() {
    const data = { profile: store.getProfile(), applications: store.getApps(), seenOffers: [...store.getSeen()], mail: loadTemplate(lang) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "mes-donnees.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportForExtension() {
    if (!profile) return;
    const { firstName, lastName, email, phone, street, number, postcode, city } = profile;
    const mail = loadTemplate(lang);
    const data = { firstName, lastName, email, phone, street, number, postcode, city, mailBody: mail.body.replaceAll("{prenom}", firstName).replaceAll("{nom}", lastName) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "profil-extension.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await signOut();
    resetTemplate(lang);
    await removeCvFile();
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
          <p>{[profile.email, profile.phone].filter(Boolean).join(" · ")}</p>
        </div>
        <Link className="btn" href={`/${lang}/inscription`}>{p.edit}</Link>
      </div>

      <SyncStatus t={t} lang={lang} />
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

        <MailSettings t={t} lang={lang} />

        <section className="panel">
          <h3>{t.cvBuilder.title}</h3>
          <p className="muted" style={{ margin: 0 }}>{t.cvBuilder.lead}</p>
          <div><Link className="btn small" href={`/${lang}/cv`}>{t.cvBuilder.open}</Link></div>
        </section>

        <section className="panel">
          <h3>{p.data}</h3>
          <p className="muted" style={{ margin: 0 }}>{account ? t.auth.dataText : p.dataText}</p>
          <div className="sheet-actions">
            <button className="btn small" onClick={exportData}>{p.export}</button>
            <button className="btn small" onClick={exportForExtension}>{p.exportExt}</button>
            <Link className="btn small" href={`/${lang}/extension`}>{p.extensionGuide}</Link>
            <button
              className="btn small"
              onClick={() => {
                store.resetTaste();
                setTasteReset(true);
              }}
            >
              {tasteReset ? p.tasteDone : p.tasteReset}
            </button>
            <button className="btn small" onClick={erase} style={{ color: "var(--bad)" }}>{p.erase}</button>
          </div>
        </section>
      </div>
    </main>
  );
}
