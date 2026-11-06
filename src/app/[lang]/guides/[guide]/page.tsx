import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

type Guide = { title: string; paras: string[] };

const GUIDES: Record<string, Record<Lang, Guide>> = {
  "job-etudiant": {
    fr: {
      title: "Job étudiant en Belgique",
      paras: [
        "En Belgique, un étudiant peut travailler avec des cotisations réduites dans la limite d'un contingent annuel de 650 heures. Au-delà, les cotisations normales s'appliquent.",
        "Tu peux vérifier les heures qu'il te reste sur la plateforme officielle student@work, avec ta carte d'identité électronique ou itsme.",
        "Les règles peuvent changer : vérifie toujours les conditions à jour sur les sites officiels avant de signer un contrat.",
      ],
    },
    nl: {
      title: "Studentenjob in België",
      paras: [
        "In België kan een student werken met verminderde bijdragen binnen een jaarlijks contingent van 650 uur. Daarboven gelden de gewone bijdragen.",
        "Je resterende uren vind je op het officiële platform student@work, met je identiteitskaart of itsme.",
        "De regels kunnen veranderen: controleer altijd de actuele voorwaarden op de officiële sites voor je een contract tekent.",
      ],
    },
  },
  "flexi-job": {
    fr: {
      title: "Flexi-job en Belgique",
      paras: [
        "Le flexi-job est un contrat de travail souple, réservé à certains secteurs et à certaines personnes, selon des conditions fixées par la loi.",
        "Les conditions d'accès et les secteurs concernés évoluent : vérifie ta situation auprès de l'ONSS ou de ton secrétariat social avant d'accepter.",
      ],
    },
    nl: {
      title: "Flexi-job in België",
      paras: [
        "De flexi-job is een soepel arbeidscontract, voorbehouden aan bepaalde sectoren en personen, onder wettelijke voorwaarden.",
        "De voorwaarden en sectoren veranderen: controleer je situatie bij de RSZ of je sociaal secretariaat voor je aanvaardt.",
      ],
    },
  },
  "cv-belgique": {
    fr: {
      title: "Faire un CV en Belgique",
      paras: [
        "Va à l'essentiel : une à deux pages, tes coordonnées, ta formation, tes expériences, tes compétences et tes langues.",
        "Indique clairement ton niveau en français, en néerlandais et en anglais : c'est souvent décisif en Belgique.",
        "Enregistre ton CV en PDF, adapte le titre au poste visé et relis l'orthographe avant d'envoyer.",
      ],
    },
    nl: {
      title: "Een cv maken in België",
      paras: [
        "Hou het kort: één tot twee pagina's, je contactgegevens, opleiding, ervaring, vaardigheden en talen.",
        "Vermeld duidelijk je niveau Nederlands, Frans en Engels: dat is in België vaak doorslaggevend.",
        "Bewaar je cv als pdf, pas de titel aan de functie aan en lees alles na voor je verstuurt.",
      ],
    },
  },
};

type Params = { lang: string; guide: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, guide } = await params;
  const g = GUIDES[guide]?.[isLang(lang) ? lang : "fr"];
  return g ? { title: g.title, description: g.paras[0] } : {};
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { lang: raw, guide } = await params;
  const lang: Lang = isLang(raw) ? raw : "fr";
  const g = GUIDES[guide]?.[lang];
  if (!g) notFound();
  return (
    <main className="page">
      <div className="page-head"><h1>{g.title}</h1></div>
      {g.paras.map((p) => <p key={p}>{p}</p>)}
      <p><Link className="btn dark" href={`/${lang}/offres`}>{lang === "nl" ? "Bekijk de vacatures" : "Voir les offres"}</Link></p>
    </main>
  );
}
