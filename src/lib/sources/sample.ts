import type { Offer } from "../types";

/** Offres fictives utilisées quand aucune clé d'API n'est configurée (démo). */
const now = new Date().toISOString();
const demo = (o: Omit<Offer, "source" | "publishedAt" | "url"> & { url?: string }): Offer => ({
  url: "https://example.org",
  source: "Démo",
  publishedAt: now,
  ...o,
});

export const SAMPLE_OFFERS: Offer[] = [
  demo({ id: "d1", title: "Vendeur·se en job étudiant (week-end)", company: "Boulangerie du Parc", city: "Liège", postcode: "4000", region: "wallonie", contract: "etudiant", description: "Accueil des clients, caisse et mise en rayon le samedi et le dimanche. Français requis, néerlandais apprécié.", language: "fr" }),
  demo({ id: "d2", title: "Stagiaire développeur web", company: "PixelForge", city: "Bruxelles", postcode: "1050", region: "bruxelles", contract: "stage", description: "Stage de 3 mois en développement JavaScript, React et Node.js dans une petite équipe produit. Anglais et français.", language: "fr" }),
  demo({ id: "d3", title: "Medewerker magazijn (studentenjob)", company: "LogiFlow", city: "Gent", postcode: "9000", region: "flandre", contract: "etudiant", description: "Orderpicking en verpakken in een modern magazijn. Flexibele uren, ideaal naast je studies. Nederlands vereist.", language: "nl" }),
  demo({ id: "d4", title: "Apprenti·e électricien·ne en alternance", company: "Volta Services", city: "Namur", postcode: "5000", region: "wallonie", contract: "alternance", description: "Formation en alternance avec l'IFAPME : installations électriques résidentielles, accompagnement par un tuteur.", language: "fr" }),
  demo({ id: "d5", title: "Junior data analyst", company: "Kanaal Analytics", city: "Antwerpen", postcode: "2000", region: "flandre", contract: "cdi", description: "Analyse van verkoopdata met SQL en Python, dashboards bouwen voor klanten. Nederlands en Engels.", language: "nl" }),
  demo({ id: "d6", title: "Aide-soignant·e (CDD 6 mois)", company: "Résidence Les Tilleuls", city: "Charleroi", postcode: "6000", region: "wallonie", contract: "cdd", description: "Soins de base et accompagnement des résidents en maison de repos. Titre d'aide-soignant requis.", language: "fr" }),
  demo({ id: "d7", title: "Chargé·e de communication junior", company: "Atelier Nord", city: "Bruxelles", postcode: "1000", region: "bruxelles", contract: "cdi", description: "Réseaux sociaux, newsletter et événements. Bilingue français et néerlandais, à l'aise avec Canva et la rédaction.", language: "fr" }),
  demo({ id: "d8", title: "Stagiair boekhouding", company: "Cijfers & Co", city: "Leuven", postcode: "3000", region: "flandre", contract: "stage", description: "Ondersteuning bij facturatie, btw-aangiftes en jaarafsluiting. Kennis van Excel is een plus.", language: "nl" }),
  demo({ id: "d9", title: "Serveur·se en intérim", company: "Brasserie Meuse", city: "Huy", postcode: "4500", region: "wallonie", contract: "interim", description: "Service en salle pour des événements et des week-ends. Expérience appréciée mais pas obligatoire.", language: "fr" }),
  demo({ id: "d10", title: "Technicien·ne support informatique", company: "HelpDesk Brussels", city: "Ixelles", postcode: "1050", region: "bruxelles", contract: "cdd", description: "Support utilisateurs, installation de postes Windows et gestion des tickets. Français, néerlandais et anglais.", language: "fr" }),
];
