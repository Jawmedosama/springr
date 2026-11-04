"use client";

import { useState } from "react";
import { cityLabel } from "@/lib/belgium";
import communes from "@/lib/communes.json";
import {
  activeCount, CONTRACT_CHOICES, DAY_CHOICES, HOUR_CHOICES, KM_CHOICES, LANG_CHOICES, NO_FILTERS, PROVINCE_CHOICES, REGION_CHOICES, type AreaChoice, type Filters,
} from "@/lib/filters";
import type { Dict } from "@/lib/i18n";

interface Props {
  t: Dict;
  filters: Filters;
  count: number;
  onChange: (f: Filters) => void;
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function FilterPanel({ t, filters: f, count, onChange }: Props) {
  const l = t.filters;
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const areaLabel = (a: AreaChoice) => (a === "germanophone" ? l.germanophone : t.regions[a]);
  const addCity = (c: string) => {
    const name = cityLabel(c.trim(), "fr");
    if (name && !f.cities.includes(name)) onChange({ ...f, cities: [...f.cities, name].slice(0, 5), allBelgium: false, provinces: [] });
    setTyped("");
  };
  const n = activeCount(f);
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });

  const chip = (on: boolean, label: string, click: () => void) => (
    <button key={label} type="button" className={on ? "chip on" : "chip"} aria-pressed={on} onClick={click}>{label}</button>
  );

  /** Pastilles des filtres actifs, retirables en un clic. */
  const pills: [string, () => void][] = [
    ...f.contracts.map((c): [string, () => void] => [t.contracts[c], () => set({ contracts: toggle(f.contracts, c) })]),
    ...(f.allBelgium ? [[l.allBelgium, () => set({ allBelgium: false })] as [string, () => void]] : []),
    ...f.regions.map((r): [string, () => void] => [areaLabel(r), () => set({ regions: toggle(f.regions, r) })]),
    ...f.provinces.map((p): [string, () => void] => [l.provinces[p], () => set({ provinces: toggle(f.provinces, p) })]),
    ...f.cities.map((c): [string, () => void] => [c, () => set({ cities: toggle(f.cities, c) })]),
    ...f.hours.map((h): [string, () => void] => [l.hours[h], () => set({ hours: toggle(f.hours, h) })]),
    ...(f.lang ? [[l.langs[f.lang], () => set({ lang: null })] as [string, () => void]] : []),
    ...(f.days ? [[l.daysLabel.replace("{n}", String(f.days)), () => set({ days: null })] as [string, () => void]] : []),
    ...(f.km ? [[`${f.km} km`, () => set({ km: null })] as [string, () => void]] : []),
    ...(f.easy ? [[t.offers.easy, () => set({ easy: false })] as [string, () => void]] : []),
    ...(f.hideAgencies ? [[l.noAgencies, () => set({ hideAgencies: false })] as [string, () => void]] : []),
  ];

  return (
    <div className="filter-box">
      <div className="filter-top">
        <button type="button" className="btn small" aria-expanded={open} onClick={() => setOpen(!open)}>
          {l.title}{n > 0 ? ` (${n})` : ""}
        </button>
        <span className="muted small">{count} {l.matching}</span>
        {n > 0 && <button type="button" className="link-btn small" onClick={() => onChange(NO_FILTERS)}>{l.reset}</button>}
      </div>

      {pills.length > 0 && (
        <div className="chips">
          {pills.map(([label, remove]) => (
            <button key={label} type="button" className="chip on" onClick={remove} aria-label={`${l.remove} ${label}`}>{label} ✕</button>
          ))}
        </div>
      )}

      {open && (
        <div className="panel filter-panel">
          <div>
            <p className="label">{l.contract}</p>
            <div className="chips">{CONTRACT_CHOICES.map((c) => chip(f.contracts.includes(c), t.contracts[c], () => set({ contracts: toggle(f.contracts, c) })))}</div>
          </div>
          <div>
            <p className="label">{l.region}</p>
            <div className="chips">
              {chip(f.allBelgium, l.allBelgium, () => set({ allBelgium: !f.allBelgium, cities: [], provinces: [] }))}
              {REGION_CHOICES.map((r) => chip(f.regions.includes(r), areaLabel(r), () => set({ regions: toggle(f.regions, r) })))}
            </div>
          </div>
          <div>
            <p className="label">{l.province}</p>
            <div className="chips">{PROVINCE_CHOICES.map((p) => chip(f.provinces.includes(p), l.provinces[p], () => set({ provinces: toggle(f.provinces, p), cities: [], allBelgium: false })))}</div>
          </div>
          <div>
            <label>{l.city}
              <input
                list="filter-cities"
                value={typed}
                placeholder={l.cityHint}
                onChange={(e) => (communes.includes(e.target.value) ? addCity(e.target.value) : setTyped(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCity(typed);
                  }
                }}
              />
              <datalist id="filter-cities">{communes.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <p className="muted small" style={{ margin: "6px 0 0" }}>{l.cityNote}</p>
          </div>
          <div>
            <p className="label">{l.language}</p>
            <div className="chips">{LANG_CHOICES.map((x) => chip(f.lang === x, l.langs[x], () => set({ lang: f.lang === x ? null : x })))}</div>
          </div>
          <div>
            <p className="label">{l.schedule}</p>
            <div className="chips">{HOUR_CHOICES.map((h) => chip(f.hours.includes(h), l.hours[h], () => set({ hours: toggle(f.hours, h) })))}</div>
          </div>
          <div>
            <p className="label">{l.published}</p>
            <div className="chips">{DAY_CHOICES.map((d) => chip(f.days === d, l.daysLabel.replace("{n}", String(d)), () => set({ days: f.days === d ? null : d })))}</div>
          </div>
          <div>
            <p className="label">{l.distance}</p>
            <div className="chips">{KM_CHOICES.map((k) => chip(f.km === k, `${k} km`, () => set({ km: f.km === k ? null : k })))}</div>
          </div>
          <div>
            <p className="label">{l.more}</p>
            <div className="chips">
              {chip(f.easy, t.offers.easy, () => set({ easy: !f.easy }))}
              {chip(f.hideAgencies, l.noAgencies, () => set({ hideAgencies: !f.hideAgencies }))}
            </div>
          </div>
          <button type="button" className="btn dark block" onClick={() => setOpen(false)}>{l.show.replace("{n}", String(count))}</button>
        </div>
      )}
    </div>
  );
}
