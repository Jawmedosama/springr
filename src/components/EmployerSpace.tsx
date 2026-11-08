"use client";

import { useCallback, useEffect, useState } from "react";
import { getDict } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase";
import type { ContractType, Lang } from "@/lib/types";
import StartDialog from "./StartDialog";

const TXT = {
  fr: {
    title: "Publier une offre",
    lead: "Gratuit pour les employeurs. Ton offre est vérifiée par notre équipe, puis montrée aux jeunes de 16 à 35 ans qui cherchent dans ta région.",
    login: "Connecte-toi ou crée un compte pour publier une offre.",
    loginBtn: "Se connecter / créer un compte",
    company: "Entreprise", jobTitle: "Intitulé du poste", city: "Ville", postcode: "Code postal", contract: "Contrat",
    regime: "Horaire (facultatif)", regimeHint: "Ex. temps plein, 20 h/semaine", salary: "Salaire (facultatif)", salaryHint: "Ex. 14 €/h brut",
    description: "Description du poste (au moins 50 caractères)", apply: "Lien ou e-mail pour postuler",
    applyHint: "https://… ou une adresse e-mail de candidature (pas d'adresse personnelle)",
    send: "Envoyer pour vérification", sending: "Envoi…",
    sent: "Merci ! Ton offre sera vérifiée, puis publiée sous 48 h ouvrées.",
    error: "L'envoi n'a pas marché. Vérifie les champs (description d'au moins 50 caractères, lien en https:// ou e-mail).",
    mine: "Mes offres", none: "Aucune offre pour l'instant.", remove: "Retirer",
    status: { pending: "En vérification", published: "Publiée", rejected: "Refusée" },
    rules: "En publiant, tu confirmes que l'offre est réelle, légale et non discriminatoire. Les agences d'intérim sont les bienvenues, mais doivent indiquer « intérim » dans le contrat.",
    unavailable: "L'espace employeurs n'est pas encore disponible.",
  },
  nl: {
    title: "Een vacature publiceren",
    lead: "Gratis voor werkgevers. Je vacature wordt door ons team gecontroleerd en daarna getoond aan jongeren van 16 tot 35 jaar die in jouw regio zoeken.",
    login: "Log in of maak een account aan om een vacature te publiceren.",
    loginBtn: "Inloggen / account aanmaken",
    company: "Bedrijf", jobTitle: "Functietitel", city: "Gemeente", postcode: "Postcode", contract: "Contract",
    regime: "Uurregeling (optioneel)", regimeHint: "Bv. voltijds, 20 u/week", salary: "Loon (optioneel)", salaryHint: "Bv. 14 €/u bruto",
    description: "Functieomschrijving (minstens 50 tekens)", apply: "Link of e-mail om te solliciteren",
    applyHint: "https://… of een sollicitatieadres (geen privéadres)",
    send: "Versturen ter controle", sending: "Versturen…",
    sent: "Bedankt! Je vacature wordt gecontroleerd en binnen 48 werkuren gepubliceerd.",
    error: "Versturen is mislukt. Controleer de velden (omschrijving van minstens 50 tekens, link met https:// of e-mail).",
    mine: "Mijn vacatures", none: "Nog geen vacatures.", remove: "Verwijderen",
    status: { pending: "In controle", published: "Gepubliceerd", rejected: "Geweigerd" },
    rules: "Door te publiceren bevestig je dat de vacature echt, wettelijk en niet-discriminerend is. Uitzendbureaus zijn welkom, maar kiezen « interim » als contract.",
    unavailable: "De werkgeversruimte is nog niet beschikbaar.",
  },
};

const CONTRACTS: ContractType[] = ["cdi", "cdd", "etudiant", "flexi", "stage", "alternance", "interim"];

interface Row { id: string; title: string; company: string; city: string; status: "pending" | "published" | "rejected"; created_at: string }

const EMPTY = { company: "", title: "", city: "", postcode: "", contract: "cdi" as ContractType, regime: "", salary: "", description: "", apply: "" };

export default function EmployerSpace({ lang }: { lang: Lang }) {
  const x = TXT[lang];
  const t = getDict(lang);
  const sb = getSupabase();
  const [user, setUser] = useState<string | null | undefined>(undefined);
  const [login, setLogin] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [mine, setMine] = useState<Row[]>([]);

  const refresh = useCallback(async (uid: string) => {
    const { data } = (await sb?.from("employer_offers").select("id,title,company,city,status,created_at").eq("owner", uid).order("created_at", { ascending: false })) ?? {};
    setMine((data as Row[]) ?? []);
  }, [sb]);

  useEffect(() => {
    if (!sb) return setUser(null);
    sb.auth.getUser().then(({ data }) => setUser(data.user?.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setUser(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => { if (user) void refresh(user); }, [user, refresh]);

  const set = (k: keyof typeof EMPTY, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sb || !user) return;
    const apply = /^https:\/\//.test(f.apply.trim()) ? f.apply.trim() : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.apply.trim()) ? `mailto:${f.apply.trim()}` : "";
    if (!apply || f.description.trim().length < 50) return setMsg({ ok: false, text: x.error });
    setBusy(true);
    const { error } = await sb.from("employer_offers").insert({
      company: f.company.trim(), title: f.title.trim(), city: f.city.trim(), postcode: f.postcode.trim() || null,
      contract: f.contract, regime: f.regime.trim() || null, salary: f.salary.trim() || null, description: f.description.trim(), apply_url: apply,
    });
    setBusy(false);
    setMsg(error ? { ok: false, text: x.error } : { ok: true, text: x.sent });
    if (!error) { setF(EMPTY); void refresh(user); }
  }

  async function remove(id: string) {
    await sb?.from("employer_offers").delete().eq("id", id);
    if (user) void refresh(user);
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>{x.title}</h1>
        <p>{x.lead}</p>
      </div>

      {!sb ? (
        <div className="panel"><p style={{ margin: 0 }}>{x.unavailable}</p></div>
      ) : user === undefined ? null : !user ? (
        <div className="panel" style={{ display: "grid", gap: 12 }}>
          <p style={{ margin: 0 }}>{x.login}</p>
          <button className="btn dark" onClick={() => setLogin(true)}>{x.loginBtn}</button>
        </div>
      ) : (
        <>
          <form className="panel" onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <label>{x.company}<input required maxLength={120} value={f.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" /></label>
            <label>{x.jobTitle}<input required maxLength={150} value={f.title} onChange={(e) => set("title", e.target.value)} /></label>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <label>{x.city}<input required maxLength={80} value={f.city} onChange={(e) => set("city", e.target.value)} /></label>
              <label>{x.postcode}<input inputMode="numeric" pattern="[1-9][0-9]{3}" maxLength={4} value={f.postcode} onChange={(e) => set("postcode", e.target.value)} /></label>
            </div>
            <label>{x.contract}
              <select value={f.contract} onChange={(e) => set("contract", e.target.value)}>
                {CONTRACTS.map((c) => <option key={c} value={c}>{t.contracts[c]}</option>)}
              </select>
            </label>
            <label>{x.regime}<input maxLength={80} placeholder={x.regimeHint} value={f.regime} onChange={(e) => set("regime", e.target.value)} /></label>
            <label>{x.salary}<input maxLength={80} placeholder={x.salaryHint} value={f.salary} onChange={(e) => set("salary", e.target.value)} /></label>
            <label>{x.description}<textarea required minLength={50} maxLength={8000} rows={8} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
            <label>{x.apply}<input required maxLength={500} placeholder={x.applyHint} value={f.apply} onChange={(e) => set("apply", e.target.value)} /></label>
            <p className="muted small" style={{ margin: 0 }}>{x.rules}</p>
            {msg && <p className={msg.ok ? "banner ok" : "banner"} role="status">{msg.text}</p>}
            <button className="btn dark" disabled={busy}>{busy ? x.sending : x.send}</button>
          </form>

          <div className="panel" style={{ marginTop: 16, display: "grid", gap: 8 }}>
            <h2 style={{ margin: 0 }}>{x.mine}</h2>
            {mine.length === 0 ? <p className="muted" style={{ margin: 0 }}>{x.none}</p> : mine.map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <span><b>{r.title}</b> · {r.city} · <span className="tag">{x.status[r.status]}</span></span>
                <button className="link-btn small" onClick={() => remove(r.id)}>{x.remove}</button>
              </div>
            ))}
          </div>
        </>
      )}
      {login && <StartDialog lang={lang} mode="login" onClose={() => setLogin(false)} />}
    </main>
  );
}
