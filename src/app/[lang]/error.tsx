"use client";

import { useEffect } from "react";
import { reportError } from "@/components/ClientErrors";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => reportError(error.message, "page"), [error]);
  const nl = typeof document !== "undefined" && document.documentElement.lang === "nl";
  return (
    <main className="page">
      <div className="empty">
        <h1 style={{ margin: 0 }}>{nl ? "Er ging iets mis" : "Un problème est survenu"}</h1>
        <p style={{ margin: 0 }}>{nl ? "Probeer het opnieuw. Je gegevens zijn niet verloren." : "Réessaie. Tes données ne sont pas perdues."}</p>
        <button className="btn dark" onClick={reset}>{nl ? "Opnieuw proberen" : "Réessayer"}</button>
      </div>
    </main>
  );
}
