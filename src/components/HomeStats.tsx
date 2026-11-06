"use client";

import { useEffect, useState } from "react";
import { getDict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

interface Stats {
  total: number;
  direct: number;
  top: string[];
  demo: boolean;
}

/** Nombre d'offres du moment et entreprises qui recrutent le plus. */
export default function HomeStats({ lang }: { lang: Lang }) {
  const h = getDict(lang).home;
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json() as Promise<Stats>)
      .then(setS)
      .catch(() => setS(null));
  }, []);

  if (!s || s.demo) return null;
  const n = (x: number) => x.toLocaleString(lang === "nl" ? "nl-BE" : "fr-BE");
  return (
    <div style={{ marginTop: 20 }}>
      <p style={{ margin: "0 0 10px", fontWeight: 600 }}>{h.liveCount.replace("{n}", n(s.total)).replace("{d}", n(s.direct))}</p>
      <p className="muted small" style={{ margin: "0 0 6px" }}>{h.topCompanies}</p>
      <div className="chips" style={{ justifyContent: "center" }}>
        {s.top.map((c) => <span className="tag line" key={c}>{c}</span>)}
      </div>
    </div>
  );
}
