"use client";

import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { attach, detach } from "@/lib/sync";

/** Branche la synchronisation dès qu'une session existe. Ne rend rien. */
export default function AuthSync() {
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let current: string | null = null;
    let mail = "";
    const start = async (id?: string, email?: string) => {
      if (!id || id === current) return;
      current = id;
      mail = email ?? "";
      if (await attach(id, mail)) window.location.reload();
    };
    // En revenant sur l'onglet, on reprend ce qui a été fait sur un autre appareil.
    const refresh = async () => {
      if (document.visibilityState === "visible" && current && (await attach(current, mail))) window.location.reload();
    };
    document.addEventListener("visibilitychange", refresh);
    sb.auth.getSession().then(({ data }) => start(data.session?.user.id, data.session?.user.email));
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        current = null;
        detach();
        return;
      }
      // Hors du rappel : un appel Supabase à l'intérieur peut bloquer la session.
      setTimeout(() => void start(session?.user.id, session?.user.email));
    });
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      data.subscription.unsubscribe();
    };
  }, []);
  return null;
}
