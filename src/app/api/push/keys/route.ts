import { randomBytes } from "node:crypto";
import webpush from "web-push";

export const dynamic = "force-dynamic";

/** Aide à la mise en place : génère des clés neuves à copier dans Vercel. Ne sert plus une fois configuré. */
export function GET() {
  if (process.env.VAPID_PRIVATE_KEY) return new Response("Déjà configuré.", { status: 404 });
  const k = webpush.generateVAPIDKeys();
  const secret = randomBytes(24).toString("base64url");
  const text = [
    "Copie ces 4 lignes dans Vercel > springr > Settings > Environment Variables (une variable par ligne).",
    "Ne les envoie à personne. Chaque visite de cette page donne des clés différentes : utilise celles d'une seule visite.",
    "",
    `NEXT_PUBLIC_VAPID_PUBLIC_KEY = ${k.publicKey}`,
    `VAPID_PRIVATE_KEY = ${k.privateKey}`,
    `PUSH_SECRET = ${secret}`,
    `CRON_SECRET = ${secret}`,
    "",
    "Puis dans Supabase > SQL Editor, colle le fichier supabase/push.sql en remplaçant CHANGE-MOI par :",
    secret,
  ].join("\n");
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
