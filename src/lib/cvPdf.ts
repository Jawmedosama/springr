"use client";

import type { Lang, Profile } from "./types";

export interface CvExtra {
  summary: string;
  experience: string;
  education: string;
}

export type CvTemplate = "classique" | "moderne";

const LABELS = {
  fr: { summary: "Profil", experience: "Expérience", education: "Formation", skills: "Compétences", languages: "Langues", contact: "Contact" },
  nl: { summary: "Profiel", experience: "Ervaring", education: "Opleiding", skills: "Vaardigheden", languages: "Talen", contact: "Contact" },
};

const GREEN: [number, number, number] = [15, 143, 76];
const INK: [number, number, number] = [14, 26, 19];
const MUTED: [number, number, number] = [92, 102, 95];

/** Le CV est créé dans le navigateur : rien n'est envoyé. */
export async function makeCvPdf(p: Profile, x: CvExtra, template: CvTemplate, lang: Lang): Promise<File> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const L = LABELS[lang];
  const name = `${p.firstName} ${p.lastName}`;
  const contact = [p.email, p.phone, [p.postcode, p.city].filter(Boolean).join(" ")].filter(Boolean) as string[];
  const clean = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\r/g, "");

  let y = 0;
  const pageBottom = 282;

  /** Écrit un texte coupé à la largeur voulue, et change de page si besoin. */
  function write(text: string, left: number, width: number, size = 10, color = INK, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size).setTextColor(...color);
    for (const line of doc.splitTextToSize(clean(text), width) as string[]) {
      if (y > pageBottom) {
        doc.addPage();
        y = 18;
      }
      doc.text(line, left, y);
      y += size * 0.47;
    }
  }

  function section(title: string, body: string, left: number, width: number) {
    if (!body.trim()) return;
    y += 4;
    write(title.toUpperCase(), left, width, 10, GREEN, true);
    doc.setDrawColor(...GREEN).setLineWidth(0.3).line(left, y - 2.6, left + width, y - 2.6);
    y += 2;
    for (const para of body.split(/\n+/)) {
      write(para, left, width);
      y += 1.4;
    }
  }

  if (template === "classique") {
    y = 22;
    write(name, 20, 170, 22, INK, true);
    y += 1;
    if (p.field) write(p.field, 20, 170, 12, GREEN, true);
    write(contact.join("  |  "), 20, 170, 9.5, MUTED);
    y += 2;
    section(L.summary, x.summary, 20, 170);
    section(L.experience, x.experience, 20, 170);
    section(L.education, x.education || p.studyLevel, 20, 170);
    section(L.skills, p.skills.join(", "), 20, 170);
    section(L.languages, p.languages.join(", "), 20, 170);
  } else {
    doc.setFillColor(...INK).rect(0, 0, 66, 297, "F");
    y = 24;
    write(p.firstName, 10, 48, 20, [255, 255, 255], true);
    y += 1;
    write(p.lastName, 10, 48, 20, [255, 255, 255], true);
    y += 6;
    const side = (title: string, lines: string[]) => {
      if (!lines.length) return;
      write(title.toUpperCase(), 10, 48, 9.5, [120, 220, 160], true);
      y += 1;
      lines.forEach((l) => write(l, 10, 48, 9.5, [235, 240, 236]));
      y += 5;
    };
    side(L.contact, contact);
    side(L.skills, p.skills);
    side(L.languages, p.languages);
    y = 24;
    if (p.field) {
      write(p.field, 76, 120, 15, GREEN, true);
      y += 1;
    }
    section(L.summary, x.summary, 76, 120);
    section(L.experience, x.experience, 76, 120);
    section(L.education, x.education || p.studyLevel, 76, 120);
  }

  const slug = name.normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\w]+/g, "-");
  return new File([doc.output("blob")], `CV-${slug}.pdf`, { type: "application/pdf" });
}
