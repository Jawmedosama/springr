"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** Sans ces deux variables, le site fonctionne sans comptes : tout reste dans le navigateur. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  // Les liens reçus par e-mail doivent marcher même ouverts dans un autre navigateur, fréquent sur iPhone.
  client ??= createClient(url, anonKey, { auth: { flowType: "implicit" } });
  return client;
}
