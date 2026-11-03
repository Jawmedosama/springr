import type { ContractType, Offer, Region } from "../types";

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

function guessContract(job: AdzunaJob): ContractType {
  const t = `${job.title} ${job.description}`.toLowerCase();
  if (/(étudiant|etudiant|student)/.test(t)) return "etudiant";
  if (/(stage|stagiair|internship)/.test(t)) return "stage";
  if (/(alternance|duaal|dual)/.test(t)) return "alternance";
  if (/(intérim|interim)/.test(t)) return "interim";
  if (job.contract_type === "permanent") return "cdi";
  if (job.contract_type === "contract") return "cdd";
  return "cdi";
}

function guessRegion(area: string[] = []): Region | undefined {
  const s = area.join(" ").toLowerCase();
  if (/brux|brussel/.test(s)) return "bruxelles";
  if (/wallon|liège|namur|hainaut|luxembourg|brabant wallon/.test(s)) return "wallonie";
  if (/vlaander|flandre|antwerp|anvers|gent|limburg|vlaams/.test(s)) return "flandre";
  return undefined;
}

/** API Adzuna pour la Belgique (pays « be »). Clé gratuite sur developer.adzuna.com. */
export async function fetchAdzuna(what = "", page = 1, where = ""): Promise<Offer[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) return [];
  const params = new URLSearchParams({
    app_id: id,
    app_key: key,
    results_per_page: "50",
    "content-type": "application/json",
  });
  if (what) params.set("what", what);
  if (where) {
    params.set("where", where);
    params.set("distance", "30");
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
    region: guessRegion(j.location?.area),
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
