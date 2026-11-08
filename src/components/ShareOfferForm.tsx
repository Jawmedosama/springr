"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase";
import type { ContractType, Lang } from "@/lib/types";
import StartDialog from "./StartDialog";

const TXT = {
  fr: {
    title: "Ajouter une offre vue ailleurs",
    lead: "Tu as vu une offre sur un autre site, une vitrine ou un réseau social ? Partage le lien : après vérification, elle aidera d'autres jeunes.",
    login: "Connecte-toi pour ajouter une offre.", loginBtn: "Se connecter / créer un compte",
    url: "Lien de l'annonce (https://…)", jobTitle: "Intitulé du poste", company: "Entreprise", city: "Ville", contract: "Contrat",
    note: "Note courte (facultatif, 300 caractères max.)", noteHint: "Ex. horaires, salaire si indiqué. Ne recopie pas l'annonce.",
    send: "Envoyer pour vérification", sending: "Envoi…",
    sent: "Merci ! L'offre apparaîtra après vérification.",
    error: "L'envoi n'a pas marché. Vérifie que le lien commence par https:// (5 offres par jour au maximum).",
    rules: "Partage seulement une vraie offre d'emploi, encore ouverte, en Belgique. Les liens trompeurs ou abusifs sont refusés et le compte peut être bloqué.",
    back: "← Retour aux offres",
  },
  nl: {
    title: "Een vacature van elders toevoegen",
    lead: "Een vacature gezien op een andere site, in een etalage of op sociale media? Deel de link: na controle helpt ze andere jongeren.",
    login: "Log in om een vacature toe te voegen.", loginBtn: "Inloggen / account aanmaken",
    url: "Link naar de vacature (https://…)", jobTitle: "Functietitel", company: "Bedrijf", city: "Gemeente", contract: "Contract",
    note: "Korte notitie (optioneel, max. 300 tekens)", noteHint: "Bv. uren, loon indien vermeld. Kopieer de vacature niet.",
    send: "Versturen ter controle", sending: "Versturen…",
    sent: "Bedankt! De vacature verschijnt na controle.",
    error: "Versturen is mislukt. Controleer of de link met https:// begint (max. 5 vacatures per dag).",
    rules: "Deel alleen een echte, nog open vacature in België. Misleidende of misbruikte links worden geweigerd en het account kan geblokkeerd worden.",
    back: "← Terug naar de vacatures",
  },
};

const CONTRACTS: ContractType[] = ["nc", "cdi", "cdd", "etudiant", "flexi", "stage", "alternance", "interim"];
const EMPTY = { url: "", title: "", company: "", city: "", contract: "nc" as ContractType, note: "" };

export default function ShareOfferForm({ lang }: { lang: Lang }) {
  const x = TXT[lang];
  const t = getDict(lang);
  const sb = getSupabase();
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [login, setLogin] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!sb) return setUser(null);
    sb.auth.getUser().then(({ data }) => setUser(data.user?.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setUser(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  const set = (k: keyof typeof EMPTY, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const url = f.url.trim();
    if (!sb || !user || !/^https:\/\/[^\s]+\.[^\s]+/.test(url)) return setMsg({ ok: false, text: x.error });
    setBusy(true);
    const { error } = await sb.from("employer_offers").insert({
      kind: "shared", company: f.company.trim(), title: f.title.trim(), city: f.city.trim(), contract: f.contract,
      description: f.note.trim().slice(0, 300), apply_url: url,
    });
    setBusy(false);
    setMsg(error ? { ok: false, text: x.error } : { ok: true, text: x.sent });
    if (!error) setF(EMPTY);
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>{x.title}</h1>
        <p>{x.lead}</p>
      </div>
      {user === undefined ? null : !user ? (
        <div className="panel" style={{ display: "grid", gap: 12 }}>
          <p style={{ margin: 0 }}>{x.login}</p>
          <button className="btn dark" onClick={() => setLogin(true)}>{x.loginBtn}</button>
        </div>
      ) : (
        <form className="panel" onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <label>{x.url}<input required type="url" inputMode="url" maxLength={500} value={f.url} onChange={(e) => set("url", e.target.value)} /></label>
          <label>{x.jobTitle}<input required maxLength={150} value={f.title} onChange={(e) => set("title", e.target.value)} /></label>
          <label>{x.company}<input required maxLength={120} value={f.company} onChange={(e) => set("company", e.target.value)} /></label>
          <label>{x.city}<input required maxLength={80} value={f.city} onChange={(e) => set("city", e.target.value)} /></label>
          <label>{x.contract}
            <select value={f.contract} onChange={(e) => set("contract", e.target.value)}>
              {CONTRACTS.map((c) => <option key={c} value={c}>{t.contracts[c]}</option>)}
            </select>
          </label>
          <label>{x.note}<textarea maxLength={300} rows={3} placeholder={x.noteHint} value={f.note} onChange={(e) => set("note", e.target.value)} /></label>
          <p className="muted small" style={{ margin: 0 }}>{x.rules}</p>
          {msg && <p className={msg.ok ? "banner ok" : "banner"} role="status">{msg.text}</p>}
          <button className="btn dark" disabled={busy}>{busy ? x.sending : x.send}</button>
        </form>
      )}
      <p style={{ marginTop: 16 }}><Link href={`/${lang}/offres`}>{x.back}</Link></p>
      {login && <StartDialog lang={lang} mode="login" onClose={() => setLogin(false)} />}
    </main>
  );
}
