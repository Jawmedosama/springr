import type { Province, Region } from "./types";

/**
 * Les codes postaux belges vont de 1000 à 9992.
 * 1000-1299 : Région de Bruxelles-Capitale
 * 1300-1499 : Brabant wallon
 * 1500-3999 : Brabant flamand, Anvers, Limbourg
 * 4000-7999 : Liège, Namur, Luxembourg, Hainaut
 * 8000-9999 : Flandre occidentale et orientale
 */
export function regionFromPostcode(postcode: string): Region | null {
  if (!/^\d{4}$/.test(postcode)) return null;
  const n = Number(postcode);
  if (n < 1000 || n > 9992) return null;
  if (n < 1300) return "bruxelles";
  if (n < 1500) return "wallonie";
  if (n < 4000) return "flandre";
  if (n < 8000) return "wallonie";
  return "flandre";
}

export const MIN_AGE = 16;
export const MAX_AGE = 35;

export function ageFrom(birthDate: string, today = new Date()): number | null {
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export function isEligibleAge(birthDate: string): boolean {
  const age = ageFrom(birthDate);
  return age !== null && age >= MIN_AGE && age <= MAX_AGE;
}

/** Quota annuel de travail étudiant à cotisations réduites (en heures). */
export const STUDENT_HOURS_QUOTA = 650;

const WALLONIE =
  /\b(wallon\w*|waals\w*|wallonie|walloni[eë]|hainaut|henegouwen|li[eè]ge|luik|namur|namen|luxembourg|luxemburg|nivelles|nijvel|wavre|waver|charleroi|mons|bergen|tournai|doornik|mouscron|moeskroen|verviers|huy|hoei|waremme|borgworm|dinant|philippeville|thuin|soignies|zinnik|ath|aat|arlon|aarlen|bastogne|bastenaken|neufch[aâ]teau|marche-en-famenne|virton)\b/i;
const FLANDRE =
  /\b(vlaander\w*|vlaams\w*|flandre\w*|antwerpen|anvers|gent|gand|limburg|limbourg|leuven|louvain|halle-vilvoorde|mechelen|malines|turnhout|hasselt|tongeren|maaseik|brugge|bruges|kortrijk|courtrai|oostende|ostende|roeselare|ieper|ypres|aalst|alost|dendermonde|sint-niklaas|oudenaarde|eeklo|tielt|veurne|diksmuide)\b/i;
const BRUXELLES = /\b(bruxelles|brussel|brussels|ixelles|elsene|uccle|ukkel|etterbeek|schaerbeek|schaarbeek|anderlecht|molenbeek|forest|vorst|evere|jette|ganshoren|koekelberg|auderghem|oudergem|saint-gilles|sint-gillis|saint-josse|woluwe\S*|watermael\S*)\b/i;

/**
 * Région d'après le lieu d'une offre. Adzuna donne les lieux en néerlandais (Nijvel, Namen, Luik).
 * « Louvain-la-Neuve » et « Waals-Brabant » doivent rester en Wallonie : la Wallonie est testée d'abord.
 */
export function regionFromPlace(place: string): Region | undefined {
  if (/louvain-la-neuve|ottignies/i.test(place) || WALLONIE.test(place)) return "wallonie";
  if (FLANDRE.test(place)) return "flandre";
  if (BRUXELLES.test(place)) return "bruxelles";
  return undefined;
}

/** Noms de lieux néerlandais et leur équivalent français. */
const PLACES_NL_FR: Record<string, string> = {
  Brussel: "Bruxelles", Elsene: "Ixelles", "Sint-Gillis": "Saint-Gilles", Ukkel: "Uccle", Vorst: "Forest",
  Schaarbeek: "Schaerbeek", Oudergem: "Auderghem", "Watermaal-Bosvoorde": "Watermael-Boitsfort",
  "Sint-Lambrechts-Woluwe": "Woluwe-Saint-Lambert", "Sint-Pieters-Woluwe": "Woluwe-Saint-Pierre",
  "Sint-Jans-Molenbeek": "Molenbeek-Saint-Jean", "Sint-Joost-ten-Node": "Saint-Josse-ten-Noode",
  "Sint-Agatha-Berchem": "Berchem-Sainte-Agathe",
  Nijvel: "Nivelles", Waver: "Wavre", Graven: "Grez-Doiceau", Geldenaken: "Jodoigne", Terhulpen: "La Hulpe",
  Eigenbrakel: "Braine-l'Alleud", Kasteelbrakel: "Braine-le-Château", "'s-Gravenbrakel": "Braine-le-Comte",
  Namen: "Namur", Luik: "Liège", Bergen: "Mons", Doornik: "Tournai", Moeskroen: "Mouscron", Aat: "Ath",
  Zinnik: "Soignies", Edingen: "Enghien", Borgworm: "Waremme", Hoei: "Huy", Aarlen: "Arlon", Bastenaken: "Bastogne",
  Antwerpen: "Anvers", Gent: "Gand", Brugge: "Bruges", Leuven: "Louvain", Mechelen: "Malines", Kortrijk: "Courtrai",
  Oostende: "Ostende", Ieper: "Ypres", Aalst: "Alost", Dendermonde: "Termonde", Tienen: "Tirlemont",
  Tongeren: "Tongres", "Sint-Niklaas": "Saint-Nicolas", Halle: "Hal", "België": "Belgique",
};
const PLACES_FR_NL = Object.fromEntries(Object.entries(PLACES_NL_FR).map(([nl, fr]) => [fr, nl]));

/** Lieu lisible dans la langue de l'interface : « Elsene, Brussel Hoofdstad » devient « Ixelles ». */
export function cityLabel(city: string, lang: "fr" | "nl"): string {
  const name = city.split(",")[0].trim();
  return (lang === "fr" ? PLACES_NL_FR[name] : PLACES_FR_NL[name]) ?? name;
}

/** Province d'après le code postal. Bruxelles n'appartient à aucune province. */
export function provinceFromPostcode(postcode?: string): Province | undefined {
  const n = Number(postcode);
  if (!n || n < 1300) return undefined;
  if (n < 1500) return "brabant-wallon";
  if (n < 2000) return "brabant-flamand";
  if (n < 3000) return "anvers";
  if (n < 3500) return "brabant-flamand";
  if (n < 4000) return "limbourg";
  if (n < 5000) return "liege";
  if (n < 6000) return "namur";
  if (n < 6600) return "hainaut";
  if (n < 7000) return "luxembourg";
  if (n < 8000) return "hainaut";
  if (n < 9000) return "flandre-occidentale";
  return "flandre-orientale";
}

const PROVINCE_WORDS: [Province, RegExp][] = [
  ["brabant-wallon", /waals[- ]brabant|brabant wallon|nijvel|nivelles|waver|wavre/i],
  ["brabant-flamand", /vlaams[- ]brabant|brabant flamand|halle-vilvoorde|leuven/i],
  ["flandre-occidentale", /west-vlaanderen|flandre occidentale|brugge|kortrijk|oostende|ieper|roeselare/i],
  ["flandre-orientale", /oost-vlaanderen|flandre orientale|\bgent\b|aalst|dendermonde|sint-niklaas/i],
  ["anvers", /antwerpen|anvers|turnhout|mechelen/i],
  ["limbourg", /\blimburg\b|limbourg|hasselt|tongeren|maaseik/i],
  ["liege", /\bluik\b|liège|liege|verviers|hoei|\bhuy\b|borgworm|waremme/i],
  ["namur", /\bnamen\b|namur|dinant|philippeville/i],
  ["hainaut", /henegouwen|hainaut|charleroi|\bbergen\b|\bmons\b|doornik|tournai|moeskroen|\baat\b|thuin|zinnik/i],
  ["luxembourg", /luxemburg|luxembourg|aarlen|arlon|bastenaken|neufch[aâ]teau|marche-en-famenne|virton/i],
];

export function provinceFromPlace(place: string): Province | undefined {
  return PROVINCE_WORDS.find(([, re]) => re.test(place))?.[0];
}

/** Communes de la Communauté germanophone (codes postaux 47xx). */
export function isGermanSpeaking(o: { postcode?: string; city: string }): boolean {
  return /^47[0-9]{2}$/.test(o.postcode ?? "") || /eupen|kelmis|lontzen|raeren|amel|büllingen|bullingen|burg-reuland|bütgenbach|butgenbach|sankt vith|saint-vith/i.test(o.city);
}
