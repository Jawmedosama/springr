"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { isEligibleAge, regionFromPostcode } from "@/lib/belgium";
import { store } from "@/lib/store";
import type { ContractType, Lang, Profile } from "@/lib/types";

const CONTRACTS: ContractType[] = ["etudiant", "stage", "alternance", "cdd", "cdi"];

export default function SignupForm({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const s = t.signup;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    firstName: "", lastName: "", email: "", birthDate: "",
    street: "", number: "", postcode: "", city: "",
    studyLevel: t.studyLevels[0], field: "", skills: "",
    languages: [] as string[], contracts: [] as ContractType[], mobilityKm: 30,
    cvText: "",
    declaredResident: false, consent: false,
  });

  useEffect(() => {
    const p = store.getProfile();
    if (p) setF((x) => ({ ...x, ...p, skills: p.skills.join(", "), cvText: p.cvText ?? "", consent: true }));
  }, []);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const region = regionFromPostcode(f.postcode);

  /** Vérifie l'étape en cours ; renvoie un message d'erreur ou null. */
  function check(i: number): string | null {
    if (i === 0) {
      if ([f.firstName, f.lastName, f.email, f.birthDate].some((v) => !v.trim())) return s.errors.required;
      if (!isEligibleAge(f.birthDate)) return s.errors.age;
    }
    if (i === 1) {
      if ([f.street, f.number, f.postcode, f.city].some((v) => !v.trim())) return s.errors.required;
      if (!region) return s.errors.postcode;
      if (!f.declaredResident) return s.errors.declare;
    }
    if (i === 2 && f.contracts.length === 0) return s.errors.contracts;
    if (i === 3 && !f.consent) return s.errors.consent;
    return null;
  }

  function next(e: React.FormEvent) {
    e.preventDefault();
    const err = check(step);
    setError(err);
    if (err) return;
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const { consent: _c, skills, cvText, ...rest } = f;
    const profile: Profile = {
      ...rest,
      region: region!,
      skills: skills.split(",").map((x) => x.trim()).filter(Boolean),
      cvText: cvText.trim() || undefined,
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

        <div>
          <div className="progress" aria-hidden>
            {s.steps.map((_, i) => <span key={i} className={i <= step ? "on" : ""} />)}
          </div>
          <p className="step-label" style={{ marginTop: 8 }}>{step + 1} / 4 · {s.steps[step]}</p>
        </div>

        {step === 0 && (
          <section className="panel">
            <h3>{s.identity}</h3>
            <div className="grid2">
              <label>{s.firstName}<input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" /></label>
              <label>{s.lastName}<input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" /></label>
              <label>{s.email}<input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></label>
              <label>{s.birthDate}<input type="date" value={f.birthDate} onChange={(e) => set("birthDate", e.target.value)} autoComplete="bday" /></label>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="panel">
            <h3>{s.address}</h3>
            <div className="grid2">
              <label className="span2">{s.street}<input value={f.street} onChange={(e) => set("street", e.target.value)} autoComplete="address-line1" /></label>
              <label>{s.number}<input value={f.number} onChange={(e) => set("number", e.target.value)} /></label>
              <label>
                {s.postcode}
                <input inputMode="numeric" maxLength={4} value={f.postcode} onChange={(e) => set("postcode", e.target.value.replace(/\D/g, ""))} autoComplete="postal-code" />
                {region && <span className="hint">✓ {t.regions[region]}</span>}
              </label>
              <label className="span2">{s.city}<input value={f.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" /></label>
            </div>
            <label className="check">
              <input type="checkbox" checked={f.declaredResident} onChange={(e) => set("declaredResident", e.target.checked)} />
              {s.declare}
            </label>
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
              <label className="span2">{s.field}<input value={f.field} onChange={(e) => set("field", e.target.value)} /></label>
              <label>{s.studyLevel}
                <select value={f.studyLevel} onChange={(e) => set("studyLevel", e.target.value)}>
                  {t.studyLevels.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label>{s.mobility}<input type="number" min={0} max={200} value={f.mobilityKm} onChange={(e) => set("mobilityKm", Number(e.target.value))} /></label>
              <label className="span2">{s.skills}<input value={f.skills} onChange={(e) => set("skills", e.target.value)} /></label>
            </div>
            <p className="label">{s.languages}</p>
            <div className="chips">
              {t.langNames.map((l) => (
                <button type="button" key={l} className={f.languages.includes(l) ? "chip on" : "chip"} onClick={() => set("languages", toggle(f.languages, l))}>{l}</button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="panel">
            <h3>{s.cv}</h3>
            <p className="muted" style={{ margin: 0 }}>{s.cvHint}</p>
            <textarea rows={10} value={f.cvText} placeholder={s.cvPlaceholder} onChange={(e) => set("cvText", e.target.value)} />
            <label className="check">
              <input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
              {s.consent}
            </label>
          </section>
        )}

        {error && <p className="error" role="alert">{error}</p>}

        <div className="form-nav">
          {step > 0 ? (
            <button type="button" className="btn" onClick={() => { setError(null); setStep(step - 1); }}>{s.back}</button>
          ) : <span />}
          <button className="btn dark" type="submit">{step < 3 ? s.next : s.submit}</button>
        </div>
      </form>
    </main>
  );
}
