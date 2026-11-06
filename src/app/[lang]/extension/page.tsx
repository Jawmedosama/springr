import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const nl = isLang(lang) && lang === "nl";
  const steps = nl
    ? [
        "Download het bestand hieronder en pak het uit.",
        "Open chrome://extensions in Chrome of edge://extensions in Edge.",
        "Zet de ontwikkelaarsmodus aan.",
        "Klik op « Uitgepakte extensie laden » en kies de uitgepakte map.",
        "Klik in je profiel op « Mijn profiel exporteren » en importeer het bestand in de extensie.",
        "Open een sollicitatieformulier en klik op « Remplir ce formulaire ». Controleer alles en verstuur zelf.",
      ]
    : [
        "Télécharge le fichier ci-dessous et décompresse-le.",
        "Ouvre chrome://extensions dans Chrome, ou edge://extensions dans Edge.",
        "Active le mode développeur.",
        "Clique sur « Charger l'extension non empaquetée » et choisis le dossier décompressé.",
        "Dans ton Profil, clique sur « Exporter mon profil pour l'extension », puis importe le fichier dans l'extension.",
        "Ouvre un formulaire de candidature et clique sur « Remplir ce formulaire ». Vérifie tout et envoie toi-même.",
      ];
  return (
    <main className="page">
      <div className="page-head">
        <h1>{nl ? "Extensie om formulieren in te vullen" : "Extension pour remplir les formulaires"}</h1>
        <p>{nl ? "Voor computers met Chrome of Edge. Werkt niet op iPhone." : "Pour ordinateur, avec Chrome ou Edge. Ne marche pas sur iPhone."}</p>
      </div>
      <p><a className="btn dark" href="/ca-va-jobber-extension.zip">{nl ? "Extensie downloaden" : "Télécharger l'extension"}</a></p>
      <ol>{steps.map((s) => <li key={s} style={{ marginBottom: 8 }}>{s}</li>)}</ol>
      <p className="muted small">
        {nl
          ? "De extensie verstuurt nooit iets en sommige formulieren worden niet volledig herkend."
          : "L'extension n'envoie jamais rien, et certains formulaires ne seront pas entièrement reconnus."}
      </p>
    </main>
  );
}
