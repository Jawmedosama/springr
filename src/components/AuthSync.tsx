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
    const start = async (id?: string, email?: string) => {
      if (!id || id === current) return;
      current = id;
      if (await attach(id, email ?? "")) window.location.reload();
    };
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
    return () => data.subscription.unsubscribe();
  }, []);
  return null;
}
