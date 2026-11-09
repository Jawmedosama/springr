"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CvFields } from "@/lib/cvParse";
import { getDict } from "@/lib/i18n";
import { isEligibleAge, regionFromPostcode } from "@/lib/belgium";
import { store } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import type { ContractType, Lang, Profile } from "@/lib/types";
import CvImport from "./CvImport";

const CONTRACTS: ContractType[] = ["etudiant", "flexi", "stage", "alternance", "cdd", "cdi"];
const LANG_INDEX: Record<string, number> = { fr: 0, nl: 1, de: 2, en: 3 };

export default function SignupForm({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const s = t.signup;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<Set<string>>(new Set());
  const hl = (k: string) => (detected.has(k) ? "filled" : undefined);
  const [f, setF] = useState({
    firstName: "", lastName: "", email: "", phone: "", birthDate: "",
    street: "", number: "", postcode: "", city: "",
    studyLevel: t.studyLevels[0], field: "", skills: "",
    languages: [] as string[], contracts: [] as ContractType[], mobilityKm: 30,
    cvText: "",
    declaredResident: true, consent: false,
  });

  useEffect(() => {
    const p = store.getProfile();
    if (p) {
      setF((x) => ({ ...x, ...p, phone: p.phone ?? "", skills: p.skills.join(", "), cvText: p.cvText ?? "", consent: true }));
      return;
    }
    // Reprend ce qui est déjà connu : le mode invité et l'adresse du compte.
    const g = store.getGuest();
    if (g) setF((x) => ({ ...x, city: g.city, contracts: g.contracts }));
    getSupabase()?.auth.getSession().then(({ data }) => {
      const mail = data.session?.user.email;
      if (mail) setF((x) => ({ ...x, email: x.email || mail }));
    });
  }, []);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const region = regionFromPostcode(f.postcode);

  /** Pré-remplit ce qui a été lu. La déclaration de résidence et le consentement restent à cocher à la main. */
  function fromCv(cv: CvFields, text: string) {
    const pick = (current: string, found?: string) => found || current;
    setDetected(new Set(Object.entries(cv).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && !v.length)).map(([k]) => k)));
    setF((x) => ({
      ...x,
      firstName: pick(x.firstName, cv.firstName),
      lastName: pick(x.lastName, cv.lastName),
      email: pick(x.email, cv.email),
      phone: pick(x.phone, cv.phone),
      birthDate: pick(x.birthDate, cv.birthDate),
      street: pick(x.street, cv.street),
      number: pick(x.number, cv.number),
      postcode: pick(x.postcode, cv.postcode),
      city: pick(x.city, cv.city),
      field: pick(x.field, cv.field),
      studyLevel: cv.studyLevel !== undefined ? t.studyLevels[cv.studyLevel] ?? x.studyLevel : x.studyLevel,
      skills: cv.skills?.length ? cv.skills.join(", ") : x.skills,
      languages: cv.languages?.length ? cv.languages.map((l) => t.langNames[LANG_INDEX[l]]).filter(Boolean) : x.languages,
      cvText: text,
    }));
  }

  /** Vérifie l'étape en cours ; renvoie un message d'erreur ou null. */
  function check(i: number): string | null {
    if (i === 0) {
      if ([f.firstName, f.lastName, f.email, f.birthDate].some((v) => !v.trim())) return s.errors.required;
      if (!isEligibleAge(f.birthDate)) return s.errors.age;
    }
    if (i === 1) {
      if ([f.street, f.number, f.postcode, f.city].some((v) => !v.trim())) return s.errors.required;
      if (!region) return s.errors.postcode;
    }
    if (i === 2 && f.contracts.length === 0) return s.errors.contracts;
    if (i === 2 && !f.consent) return s.errors.consent;
    return null;
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    const err = check(step);
    setError(err);
    if (err) return;
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const { consent: _c, skills, cvText, phone, ...rest } = f;
    const profile: Profile = {
      ...rest,
      region: region!,
      skills: skills.split(",").map((x) => x.trim()).filter(Boolean),
      cvText: cvText.trim() || undefined,
      phone: phone.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    store.setProfile(profile);
    router.push(`/${lang}/offres`);
  }

  return (
    <main className="page">
      <form className="form" onSubmit={next} noValidate>
        <div className="page-head">
          <h1>{s.title}</h1>
          <p>{s.intro}</p>
        </div>

        {step === 0 && <CvImport t={t} hasCv={Boolean(f.cvText)} onResult={fromCv} />}

        <div>
          <div className="progress" aria-hidden>
            {s.steps.map((_, i) => <span key={i} className={i <= step ? "on" : ""} />)}
          </div>
          <p className="step-label" style={{ marginTop: 8 }}>{step + 1} / 3 · {s.steps[step]}</p>
        </div>

        {step === 0 && (
          <section className="panel">
            <h3>{s.identity}</h3>
            <div className="grid2">
              <label>{s.firstName}<input className={hl("firstName")} value={f.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" /></label>
              <label>{s.lastName}<input className={hl("lastName")} value={f.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" /></label>
              <label>{s.email}<input type="email" className={hl("email")} value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></label>
              <label>{s.phone}<input type="tel" className={hl("phone")} value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" /></label>
              <label>{s.birthDate}<input type="date" className={hl("birthDate")} value={f.birthDate} onChange={(e) => set("birthDate", e.target.value)} autoComplete="bday" /></label>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="panel">
            <h3>{s.address}</h3>
            <div className="grid2">
              <label className="span2">{s.street}<input className={hl("street")} value={f.street} onChange={(e) => set("street", e.target.value)} autoComplete="address-line1" /></label>
              <label>{s.number}<input className={hl("number")} value={f.number} onChange={(e) => set("number", e.target.value)} /></label>
              <label>
                {s.postcode}
                <input inputMode="numeric" maxLength={4} className={hl("postcode")} value={f.postcode} onChange={(e) => set("postcode", e.target.value.replace(/\D/g, ""))} autoComplete="postal-code" />
                {region && <span className="hint">✓ {t.regions[region]}</span>}
              </label>
              <label className="span2">{s.city}<input className={hl("city")} value={f.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" /></label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="panel">
            <h3>{s.profile}</h3>
            <p className="label">{s.contracts}</p>
            <div className="chips">
              {CONTRACTS.map((c) => (
                <button type="button" key={c} className={f.contracts.includes(c) ? "chip on" : "chip"} onClick={() => set("contracts", toggle(f.contracts, c))}>{t.contracts[c]}</button>
              ))}
            </div>
            <div className="grid2">
              <label className="span2">{s.field}<input className={hl("field")} value={f.field} onChange={(e) => set("field", e.target.value)} /></label>
              <label>{s.studyLevel}
                <select className={hl("studyLevel")} value={f.studyLevel} onChange={(e) => set("studyLevel", e.target.value)}>
                  {t.studyLevels.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label>{s.mobility}<input type="number" min={0} max={200} value={f.mobilityKm} onChange={(e) => set("mobilityKm", Number(e.target.value))} /></label>
              <label className="span2">{s.skills}<input className={hl("skills")} value={f.skills} onChange={(e) => set("skills", e.target.value)} /></label>
            </div>
            <p className="label">{s.languages}</p>
            <div className="chips">
              {t.langNames.map((l) => (
                <button type="button" key={l} className={f.languages.includes(l) ? "chip on" : "chip"} onClick={() => set("languages", toggle(f.languages, l))}>{l}</button>
              ))}
            </div>
            <label className="check">
              <input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
              {s.consent}
            </label>
            <Link className="small" href={`/${lang}/legal/confidentialite`} target="_blank">{s.readLegal}</Link>
          </section>
        )}


        {error && <p className="error" role="alert">{error}</p>}

        <div className="form-nav">
          {step > 0 ? (
            <button type="button" className="btn" onClick={() => { setError(null); setStep(step - 1); }}>{s.back}</button>
          ) : <span />}
          <button className="btn dark" type="submit">{step < 2 ? s.next : s.submit}</button>
        </div>
      </form>
    </main>
  );
}
