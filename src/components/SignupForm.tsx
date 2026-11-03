"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { isEligibleAge, regionFromPostcode } from "@/lib/belgium";
import { store } from "@/lib/store";
import type { ContractType, Lang, Profile } from "@/lib/types";

const CONTRACTS: ContractType[] = ["etudiant", "stage", "alternance", "cdd", "cdi", "interim"];

export default function SignupForm({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const s = t.signup;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    firstName: "", lastName: "", email: "", birthDate: "",
    street: "", number: "", postcode: "", city: "",
    studyLevel: t.studyLevels[0], field: "", skills: "",
    languages: [] as string[], contracts: [] as ContractType[], mobilityKm: 30,
    declaredResident: false, consent: false,
  });

  useEffect(() => {
    const p = store.getProfile();
    if (p) setF((x) => ({ ...x, ...p, skills: p.skills.join(", "), consent: true }));
  }, []);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const region = regionFromPostcode(f.postcode);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const required = [f.firstName, f.lastName, f.email, f.birthDate, f.street, f.number, f.postcode, f.city];
    if (required.some((v) => !v.trim()) || f.contracts.length === 0) return setError(s.errors.required);
    if (!isEligibleAge(f.birthDate)) return setError(s.errors.age);
    if (!region) return setError(s.errors.postcode);
    if (!f.declaredResident) return setError(s.errors.declare);
    if (!f.consent) return setError(s.errors.consent);
    const { consent: _c, skills, ...rest } = f;
    const profile: Profile = {
      ...rest,
      region,
      skills: skills.split(",").map((x) => x.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    store.setProfile(profile);
    router.push(`/${lang}/offres`);
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <h1>{s.title}</h1>
      <p className="muted">{s.intro}</p>

      <fieldset>
        <legend>{s.identity}</legend>
        <div className="grid2">
          <label>{s.firstName}<input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" /></label>
          <label>{s.lastName}<input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" /></label>
          <label>{s.email}<input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></label>
          <label>{s.birthDate}<input type="date" value={f.birthDate} onChange={(e) => set("birthDate", e.target.value)} autoComplete="bday" /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>{s.address}</legend>
        <div className="grid2">
          <label className="span2">{s.street}<input value={f.street} onChange={(e) => set("street", e.target.value)} autoComplete="address-line1" /></label>
          <label>{s.number}<input value={f.number} onChange={(e) => set("number", e.target.value)} /></label>
          <label>
            {s.postcode}
            <input inputMode="numeric" maxLength={4} value={f.postcode} onChange={(e) => set("postcode", e.target.value.replace(/\D/g, ""))} autoComplete="postal-code" />
            {region && <span className="hint">{t.regions[region]}</span>}
          </label>
          <label className="span2">{s.city}<input value={f.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" /></label>
        </div>
        <label className="check">
          <input type="checkbox" checked={f.declaredResident} onChange={(e) => set("declaredResident", e.target.checked)} />
          {s.declare}
        </label>
      </fieldset>

      <fieldset>
        <legend>{s.profile}</legend>
        <div className="grid2">
          <label>{s.studyLevel}
            <select value={f.studyLevel} onChange={(e) => set("studyLevel", e.target.value)}>
              {t.studyLevels.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label>{s.field}<input value={f.field} onChange={(e) => set("field", e.target.value)} /></label>
          <label className="span2">{s.skills}<input value={f.skills} onChange={(e) => set("skills", e.target.value)} /></label>
          <label>{s.mobility}<input type="number" min={0} max={200} value={f.mobilityKm} onChange={(e) => set("mobilityKm", Number(e.target.value))} /></label>
        </div>
        <p className="label">{s.languages}</p>
        <div className="chips">
          {t.langNames.map((l) => (
            <button type="button" key={l} className={f.languages.includes(l) ? "chip on" : "chip"} onClick={() => set("languages", toggle(f.languages, l))}>{l}</button>
          ))}
        </div>
        <p className="label">{s.contracts}</p>
        <div className="chips">
          {CONTRACTS.map((c) => (
            <button type="button" key={c} className={f.contracts.includes(c) ? "chip on" : "chip"} onClick={() => set("contracts", toggle(f.contracts, c))}>{t.contracts[c]}</button>
          ))}
        </div>
      </fieldset>

      <label className="check">
        <input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
        {s.consent}
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn primary" type="submit">{s.submit}</button>
    </form>
  );
}
