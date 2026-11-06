import { isLang } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const nl = isLang(lang) && lang === "nl";
  return (
    <main className="page">
      <div className="page-head">
        <h1>{nl ? "Een vacature publiceren" : "Publier une offre"}</h1>
        <p>{nl ? "Binnenkort beschikbaar voor werkgevers." : "Bientôt disponible pour les employeurs."}</p>
      </div>
      <div className="panel">
        <p style={{ margin: 0 }}>
          {nl
            ? "Bedrijven zullen hier hun vacatures kunnen publiceren, na controle door ons team."
            : "Les entreprises pourront publier ici leurs offres, après vérification par notre équipe."}
        </p>
      </div>
    </main>
  );
}
