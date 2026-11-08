"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

interface Row { id: string; company: string; title: string; city: string; contract: string; description: string; apply_url: string; status: string; created_at: string; kind?: string }

/** Réservé au compte administrateur (voir supabase/employer-offers.sql) : les autres comptes ne voient rien ici. */
export default function Moderation() {
  const sb = getSupabase();
  const [rows, setRows] = useState<Row[] | null>(null);
  const load = useCallback(async () => {
    const { data } = (await sb?.from("employer_offers").select("*").eq("status", "pending").order("created_at")) ?? {};
    setRows((data as Row[]) ?? []);
  }, [sb]);
  useEffect(() => { void load(); }, [load]);

  async function decide(id: string, status: "published" | "rejected") {
    await sb?.from("employer_offers").update({ status }).eq("id", id);
    void load();
  }

  return (
    <main className="page">
      <div className="page-head"><h1>Offres à vérifier</h1><p>Vérifie que l'offre est réelle et correcte, puis publie-la ou refuse-la.</p></div>
      {rows === null ? null : rows.length === 0 ? <div className="panel"><p style={{ margin: 0 }}>Rien à vérifier (ou ce compte n'est pas administrateur).</p></div> : rows.map((r) => (
        <div key={r.id} className="panel" style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{r.kind === "shared" ? "🔗 Lien partagé · " : "🏢 Employeur · "}{r.title}</h2>
          <p className="muted" style={{ margin: 0 }}>{r.company} · {r.city} · {r.contract} · {new Date(r.created_at).toLocaleDateString("fr-BE")}</p>
          <p style={{ whiteSpace: "pre-line", margin: 0 }}>{r.description}</p>
          <p className="small" style={{ margin: 0 }}>{r.kind === "shared" ? "Annonce" : "Postuler"} : <a href={r.apply_url} target="_blank" rel="noreferrer nofollow">{r.apply_url}</a></p>
          <div className="sheet-actions">
            <button className="btn dark" onClick={() => decide(r.id, "published")}>Publier</button>
            <button className="btn" onClick={() => decide(r.id, "rejected")}>Refuser</button>
          </div>
        </div>
      ))}
    </main>
  );
}
