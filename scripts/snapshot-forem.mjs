// Prépare la copie des offres du Forem au moment du build sur Vercel.
// Le portail limite fortement les appels anonymes. Chaque build réutilise donc la copie publiée
// par le déploiement précédent si elle a moins de 20 heures, et ne télécharge le jeu complet
// qu'au-delà. Sans copie du tout, le build échoue : la version en ligne reste en place.
import fs from "node:fs";

if (!process.env.VERCEL) {
  console.log("Forem : build local, pas de téléchargement.");
  process.exit(0);
}

const SITE = "https://springr-two.vercel.app/data";
const FIELDS = [
  "numerooffreforem", "titreoffre", "lieuxtravaillocalite", "lieuxtravailregion", "lieuxtravailcodepostal", "lieuxtravailgeo",
  "typecontrat", "nomemployeur", "regimetravail", "niveauxetudes", "langues", "experiencerequise", "secteurs",
  "secteurscodenace", "url", "datedebutdiffusion", "datefindiffusion", "metier",
];

async function json(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fromPortal() {
  const today = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams({
    select: FIELDS.join(","),
    where: `lieuxtravailregion="Belgique" and datefindiffusion >= date'${today}'`,
    order_by: "datedebutdiffusion desc",
  });
  const records = await json(`https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem/exports/json?${params}`);
  if (!Array.isArray(records) || records.length === 0) throw new Error("réponse vide");
  return records.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null)));
}

function save(records, fetchedAt) {
  const text = JSON.stringify(records);
  fs.mkdirSync("data", { recursive: true });
  fs.mkdirSync("public/data", { recursive: true });
  fs.writeFileSync("data/forem.json", text);
  fs.writeFileSync("public/data/forem.json", text);
  fs.writeFileSync("public/data/forem-meta.json", JSON.stringify({ fetchedAt }));
  console.log(`Forem : ${records.length} offres du ${fetchedAt}`);
}

const previous = await json(`${SITE}/forem-meta.json`).catch(() => null);
const age = previous ? Date.now() - new Date(previous.fetchedAt).getTime() : Infinity;

if (age < 20 * 3600 * 1000) {
  save(await json(`${SITE}/forem.json`), previous.fetchedAt);
} else {
  try {
    save(await fromPortal(), new Date().toISOString());
  } catch (e) {
    console.warn(`Forem : portail indisponible (${e.message}).`);
    if (!previous) {
      console.error("Forem : aucune copie disponible, build arrêté pour garder la version en ligne.");
      process.exit(1);
    }
    save(await json(`${SITE}/forem.json`), previous.fetchedAt);
  }
}
