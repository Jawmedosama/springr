import { provinceFromPlace, regionFromPlace } from "../belgium";
import type { ContractType, Offer } from "../types";

interface Row {
  id: string;
  company: string;
  title: string;
  city: string;
  postcode: string | null;
  contract: ContractType;
  regime: string | null;
  salary: string | null;
  description: string;
  apply_url: string;
  created_at: string;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** Offres publiées directement par les employeurs sur Ça va jobber, après validation. */
export async function fetchEmployers(q: { what?: string; where?: string } = {}): Promise<Offer[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  const res = await fetch(`${url}/rest/v1/employer_offers?status=eq.published&select=*&order=created_at.desc&limit=1000`, {
    headers: { apikey: anon, authorization: `Bearer ${anon}` },
    next: { revalidate: 300 },
  }).catch(() => null);
  if (!res?.ok) return [];
  const rows = (await res.json()) as Row[];
  const words = norm(q.what ?? "").split(/\s+/).filter((w) => w.length > 2);
  const places = norm(q.where ?? "").split(",").map((c) => c.trim()).filter(Boolean);
  return rows
    .filter((r) => !words.length || words.some((w) => norm(`${r.title} ${r.description}`).includes(w)))
    .filter((r) => !places.length || places.some((p) => norm(r.city).includes(p) || p.includes(norm(r.city))))
    .map((r) => ({
      id: `direct-${r.id}`,
      title: r.title,
      company: r.company,
      city: r.city,
      postcode: r.postcode ?? undefined,
      region: regionFromPlace(`${r.city} ${r.postcode ?? ""}`),
      province: provinceFromPlace(`${r.city} ${r.postcode ?? ""}`),
      contract: r.contract,
      regime: r.regime ?? undefined,
      salary: r.salary ?? undefined,
      description: r.description,
      url: r.apply_url,
      source: "Ça va jobber",
      publishedAt: r.created_at,
    }));
}
