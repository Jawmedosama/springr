"use client";

import { useEffect } from "react";

/** Envoie le message d'erreur, sans donnée de la page, vers les journaux du serveur. */
export function reportError(message: string, where: string) {
  try {
    navigator.sendBeacon("/api/client-error", JSON.stringify({ message: message.slice(0, 300), where, path: location.pathname }));
  } catch {
    /* rien à faire */
  }
}

export default function ClientErrors() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportError(e.message, "window");
    const onReject = (e: PromiseRejectionEvent) => reportError(String(e.reason), "promise");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, []);
  return null;
}
