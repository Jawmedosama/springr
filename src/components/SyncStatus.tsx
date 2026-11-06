"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase";
import { syncNow } from "@/lib/sync";
import type { Lang } from "@/lib/types";

/** Dit clairement si les données de cet appareil suivent le compte. */
export default function SyncStatus({ t, lang }: { t: Dict; lang: Lang }) {
  const s = t.sync;
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return setEmail(null);
    sb.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  async function run() {
    setState("busy");
    const r = await syncNow();
    if (r.changed) return window.location.reload();
    setCount(r.count);
    setState(r.ok ? "done" : "error");
  }

  if (email === undefined || !getSupabase()) return null;
  return (
    <div className={email ? "banner ok" : "banner"} style={{ marginBottom: 16 }}>
      {email ? (
        <>
          <b>{s.on}</b> ({email})
          {state === "done" && <div className="small">{s.done.replace("{n}", String(count))}</div>}
          {state === "error" && <div className="small error" role="alert">{s.failed}</div>}
          <div style={{ marginTop: 8 }}>
            <button className="btn small" disabled={state === "busy"} onClick={run}>{state === "busy" ? s.busy : s.now}</button>
          </div>
        </>
      ) : (
        <>
          <b>{s.off}</b> {s.offText} <Link href={`/${lang}/connexion`}>{s.login} →</Link>
        </>
      )}
    </div>
  );
}
