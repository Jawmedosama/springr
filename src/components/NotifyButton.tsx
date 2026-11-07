"use client";

import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase";
import type { Lang } from "@/lib/types";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function toBytes(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

const supported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

/** Une notification par jour quand de nouvelles offres correspondent à la recherche. Rien de personnel n'est enregistré. */
export default function NotifyButton({ t, lang, query }: { t: Dict; lang: Lang; query: object }) {
  const o = t.offers;
  const [state, setState] = useState<"hidden" | "off" | "on" | "ios" | "denied" | "busy">("hidden");

  useEffect(() => {
    if (!KEY || !getSupabase()) return;
    if (isIos() && !standalone()) return setState("ios");
    if (!supported()) return;
    if (Notification.permission === "denied") return setState("denied");
    navigator.serviceWorker.getRegistration("/sw.js").then((r) => r?.pushManager.getSubscription()).then((s) => setState(s ? "on" : "off")).catch(() => setState("off"));
  }, []);

  // La recherche change : l'abonnement suit les nouveaux filtres.
  useEffect(() => {
    if (state !== "on") return;
    navigator.serviceWorker.getRegistration("/sw.js").then((r) => r?.pushManager.getSubscription()).then((s) => s && save(s)).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query), state]);

  async function save(s: PushSubscription) {
    const j = s.toJSON();
    await getSupabase()?.rpc("push_subscribe", { p_endpoint: s.endpoint, p_p256dh: j.keys?.p256dh, p_auth: j.keys?.auth, p_lang: lang, p_query: query });
  }

  async function turnOn() {
    if (!KEY) return;
    setState("busy");
    try {
      if ((await Notification.requestPermission()) !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const s = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(KEY) }));
      await save(s);
      setState("on");
    } catch {
      setState("off");
    }
  }

  async function turnOff() {
    setState("busy");
    const s = await navigator.serviceWorker.getRegistration("/sw.js").then((r) => r?.pushManager.getSubscription()).catch(() => null);
    if (s) {
      await getSupabase()?.rpc("push_unsubscribe", { p_endpoint: s.endpoint });
      await s.unsubscribe().catch(() => undefined);
    }
    setState("off");
  }

  if (state === "hidden") return null;
  if (state === "ios") return <p className="muted small" style={{ margin: 0 }}>{o.notifyOn} : {o.notifyIos}</p>;
  if (state === "denied") return <p className="muted small" style={{ margin: 0 }}>{o.notifyDenied}</p>;
  if (state === "on")
    return (
      <p className="small" style={{ margin: 0 }}>
        {o.notifyDone} · <button type="button" className="link-btn small" onClick={turnOff}>{o.notifyOff}</button>
      </p>
    );
  return <button type="button" className="chip" disabled={state === "busy"} onClick={turnOn}>{o.notifyOn}</button>;
}
