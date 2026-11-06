"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";

export const MIN_PASSWORD = 8;

function strength(p: string): "weak" | "medium" | "strong" {
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/].filter((r) => r.test(p)).length;
  if (p.length >= 12 && kinds >= 3) return "strong";
  return p.length >= MIN_PASSWORD && kinds >= 2 ? "medium" : "weak";
}

interface Props {
  t: Dict;
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Mot de passe à créer : conseil de solidité et remplissage adapté. */
  create?: boolean;
}

export default function PasswordField({ t, label, value, onChange, create }: Props) {
  const w = t.pw;
  const [shown, setShown] = useState(false);
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label>{label}
        <input type={shown ? "text" : "password"} required minLength={create ? MIN_PASSWORD : undefined} autoComplete={create ? "new-password" : "current-password"} value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span className="muted small" aria-live="polite">{create && value ? w[strength(value)] : create ? w.rule : ""}</span>
        <button type="button" className="link-btn small" onClick={() => setShown(!shown)}>{shown ? w.hide : w.show}</button>
      </div>
    </div>
  );
}
