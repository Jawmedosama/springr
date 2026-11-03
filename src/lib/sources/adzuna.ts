import { regionFromPlace } from "../belgium";
import type { ContractType, Offer } from "../types";

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  contract_type?: string;
  contract_time?: string;
  salary_min?: number;
  salary_max?: number;
}

/** Le titre fait foi ; dans la description, on ne retient que des expressions sans ambiguïté. */
function guessContract(job: AdzunaJob): ContractType {
  const title = job.title.toLowerCase();
  const text = `${title} ${job.description.toLowerCase()}`;
  if (/(étudiant|etudiant|student|jobiste)/.test(title) || /(job étudiant|job etudiant|studentenjob|jobstudent|\b(un|une|des) étudiant)/.test(text)) return "etudiant";
  if (/\b(stage|stagiair\w*|internship|intern)\b/.test(title)) return "stage";
  if (/\b(alternance|duaal|apprenti\w*)\b/.test(title)) return "alternance";
  if (/(intérim|interim|uitzend)/.test(title)) return "interim";
  if (job.contract_type === "permanent" || /\b(cdi|vast contract|onbepaalde duur)\b|durée indéterminée/.test(text)) return "cdi";
  if (job.contract_type === "contract" || /\b(cdd|bepaalde duur|tijdelijk contract)\b|durée déterminée/.test(text)) return "cdd";
  return "nc";
}

/** API Adzuna pour la Belgique (pays « be »). Clé gratuite sur developer.adzuna.com. */
export async function fetchAdzuna(what = "", page = 1, where = "", km = 30): Promise<Offer[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) return [];
  const params = new URLSearchParams({
    app_id: id,
    app_key: key,
    results_per_page: "50",
    max_days_old: "45",
    "content-type": "application/json",
  });
  if (what) params.set("what", what);
  else params.set("sort_by", "date");
  if (where) {
    params.set("where", where);
    params.set("distance", String(km));
  }
  const res = await fetch(
    `https://api.adzuna.com/v1/api/jobs/be/search/${page}?${params}`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: AdzunaJob[] };
  return (data.results ?? []).map((j) => ({
    id: `adzuna-${j.id}`,
    title: j.title.replace(/<[^>]+>/g, ""),
    company: j.company?.display_name ?? "",
    city: j.location?.display_name ?? "",
    region: regionFromPlace([...(j.location?.area ?? []), j.location?.display_name ?? ""].join(", ")),
    contract: guessContract(j),
    description: j.description.replace(/<[^>]+>/g, ""),
    url: j.redirect_url,
    source: "Adzuna",
    publishedAt: j.created,
    salary:
      j.salary_min && j.salary_max
        ? `${Math.round(j.salary_min)} à ${Math.round(j.salary_max)} €`
        : undefined,
  }));
}
