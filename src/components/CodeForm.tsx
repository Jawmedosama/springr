"use client";

import { useState } from "react";
import { getDict } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase";
import type { Lang } from "@/lib/types";

/** Le code se tape là où on veut être connecté : pas de piège de navigateur, comme avec le lien. */
export default function CodeForm({ email, lang }: { email: string; lang: Lang }) {
  const s = getDict(lang).start;
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setState("busy");
    const { error } = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) setState("error");
    else window.location.href = `/${lang}/profil`;
  }

  return (
    <form onSubmit={verify} style={{ display: "grid", gap: 12 }}>
      <p className="banner ok" style={{ margin: 0 }}>{s.sent}</p>
      <label>{s.code}
        <input inputMode="numeric" autoComplete="one-time-code" required maxLength={10} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
      </label>
      {state === "error" && <p className="error" role="alert" style={{ margin: 0 }}>{s.codeError}</p>}
      <button className="btn dark block" type="submit" disabled={state === "busy" || !code}>{state === "busy" ? s.verifying : s.verify}</button>
    </form>
  );
}
