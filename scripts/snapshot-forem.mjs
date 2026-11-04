// Télécharge une fois toutes les offres du Forem (une seule requête) au moment du build.
// Le portail limite les appels anonymes : le site cherche ensuite dans ce fichier.
// En cas d'échec, le build continue et le site interroge le portail en direct.
import fs from "node:fs";

const FIELDS = [
  "numerooffreforem", "titreoffre", "lieuxtravaillocalite", "lieuxtravailregion", "lieuxtravailcodepostal", "lieuxtravailgeo",
  "typecontrat", "nomemployeur", "regimetravail", "niveauxetudes", "langues", "experiencerequise", "secteurs",
  "secteurscodenace", "url", "datedebutdiffusion", "datefindiffusion", "metier",
];
const today = new Date().toISOString().slice(0, 10);
const params = new URLSearchParams({
  select: FIELDS.join(","),
  where: `lieuxtravailregion="Belgique" and datefindiffusion >= date'${today}'`,
  order_by: "datedebutdiffusion desc",
});
const url = `https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/exports/json?${params}`;

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const records = await res.json();
  if (!Array.isArray(records) || records.length === 0) throw new Error("réponse vide");
  const slim = records.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null)));
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("data/forem.json", JSON.stringify(slim));
  console.log(`Forem : ${slim.length} offres, ${Math.round(fs.statSync("data/forem.json").size / 1e6)} Mo`);
} catch (e) {
  console.warn(`Forem : pas de copie du jour (${e.message}), le site interrogera le portail en direct.`);
}
