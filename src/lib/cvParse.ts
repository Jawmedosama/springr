import { regionFromPostcode } from "./belgium";

/** Ce qu'on a pu lire dans un CV. Rien n'est définitif : la personne confirme ou corrige chaque champ. */
export interface CvFields {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  street?: string;
  number?: string;
  postcode?: string;
  city?: string;
  field?: string;
  /** Position dans la liste des niveaux d'études. */
  studyLevel?: number;
  skills?: string[];
  /** Codes : fr, nl, de, en. */
  languages?: string[];
}

const STREET = /\b((?:rue|avenue|av\.|boulevard|bd|chaussée|place|chemin|allée|clos|square|quai|impasse)\s[^\n,\d]{2,40}|[\p{L}'-]{3,30}(?:straat|laan|steenweg|plein|weg|dreef))[ ,]+(\d+[a-zA-Z]?)\b/iu;
const POSTCODE_CITY = /\b([1-9]\d{3})[ ,]+([A-ZÀ-Ý][\p{L}'-]+(?: [A-ZÀ-Ý][\p{L}'-]+)*)/gu;
const BIRTH = /(?:naissance|né\(?e?\)?\s+le|née?\s+le|geboren|geboortedatum|birth)[^\d\n]{0,20}(\d{1,2})[/.-](\d{1,2})[/.-]((?:19|20)\d{2})/i;
const SECTION = /^(compétences|competences|skills|vaardigheden|aptitudes|expérience|experience|ervaring|formation|opleiding|education|langues|talen|languages|profil|profiel|contact)\b/i;

function name(lines: string[]): { firstName?: string; lastName?: string } {
  const line = lines.slice(0, 6).find((l) => /^[\p{L}'-]+(?: [\p{L}'-]+){1,3}$/u.test(l) && !SECTION.test(l) && !/curriculum|vitae|\bcv\b/i.test(l));
  if (!line) return {};
  const [first, ...rest] = line.split(" ");
  const nice = (s: string) => (s === s.toUpperCase() ? s[0] + s.slice(1).toLowerCase() : s);
  return { firstName: nice(first), lastName: rest.map(nice).join(" ") };
}

function studyLevel(text: string): number | undefined {
  if (/\b(master|licence en|licentiaat)\b/i.test(text)) return 3;
  if (/\b(bachelier|bachelor|baccalauréat|graduat|gradué)\b/i.test(text)) return 2;
  if (/\b(cess|diploma secundair|enseignement secondaire supérieur)\b/i.test(text)) return 1;
  if (/\b(alternance|ifapme|efp|syntra)\b/i.test(text)) return 4;
  return undefined;
}

function languages(text: string): string[] {
  const found: [string, RegExp][] = [
    ["fr", /\b(français|francais|frans|french)\b/i],
    ["nl", /\b(néerlandais|neerlandais|nederlands|dutch)\b/i],
    ["de", /\b(allemand|duits|german|deutsch)\b/i],
    ["en", /\b(anglais|engels|english)\b/i],
  ];
  return found.filter(([, re]) => re.test(text)).map(([code]) => code);
}

const KNOWN_SKILLS = ["vente", "caisse", "accueil", "service client", "gestion de stock", "nettoyage", "cuisine", "permis B", "Excel", "Word", "PowerPoint", "comptabilité", "communication", "marketing", "réseaux sociaux", "JavaScript", "React", "Python", "SQL", "Java", "Photoshop", "soudure", "électricité", "mécanique", "logistique", "cariste"];

function skills(lines: string[]): string[] {
  const start = lines.findIndex((l) => /^(compétences|competences|skills|vaardigheden|aptitudes)\b/i.test(l));
  const out: string[] = KNOWN_SKILLS.filter((k) => new RegExp(`(^|[^\\p{L}])${k}([^\\p{L}]|$)`, "iu").test(lines.join(" ")));
  if (start < 0) return out.slice(0, 12);
  for (const l of lines.slice(start + 1, start + 15)) {
    if (SECTION.test(l)) break;
    l.split(/[,;•·|]/).map((x) => x.replace(/^[-–\s]+/, "").trim()).filter((x) => x.length > 1 && x.length < 40).forEach((x) => out.push(x));
  }
  return [...new Set(out)].slice(0, 12);
}

/** Lecture dans le navigateur : les coordonnées ne quittent jamais la page. */
export function parseCv(text: string): CvFields {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const f: CvFields = { ...name(lines), studyLevel: studyLevel(text), languages: languages(text), skills: skills(lines) };
  const title = lines.findIndex((l) => l === `${f.firstName} ${f.lastName}` || l.toLowerCase() === `${f.firstName} ${f.lastName}`.toLowerCase());
  const next = title >= 0 ? lines[title + 1] : undefined;
  if (next && next.length < 50 && !/[\d@]/.test(next) && !SECTION.test(next)) f.field = next;
  f.email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  f.phone = text.match(/(?:\+32|0032|\b0)[ ./-]?[1-9](?:[ ./-]?\d){7,8}\b/)?.[0].trim();
  const birth = text.match(BIRTH);
  if (birth) f.birthDate = `${birth[3]}-${birth[2].padStart(2, "0")}-${birth[1].padStart(2, "0")}`;
  const street = text.match(STREET);
  if (street) {
    f.street = street[1].trim();
    f.number = street[2];
  }
  for (const m of text.matchAll(POSTCODE_CITY)) {
    if (regionFromPostcode(m[1])) {
      f.postcode = m[1];
      f.city = m[2];
      break;
    }
  }
  return f;
}

/** Extrait le texte d'un fichier, dans le navigateur. */
export async function readCvFile(file: File): Promise<string> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      let line = "";
      const out: string[] = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        line += item.str;
        if (item.hasEOL) {
          out.push(line);
          line = "";
        }
      }
      pages.push([...out, line].join("\n"));
    }
    return pages.join("\n");
  }
  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
  }
  return file.text();
}
