import type { Lang } from "./types";

/**
 * Textes légaux. Les [CROCHETS] sont à remplacer par l'éditeur du site,
 * et l'ensemble doit être relu par un juriste avant l'ouverture au public.
 */
export type LegalSlug = "mentions" | "confidentialite" | "conditions" | "cookies";

export const LEGAL_SLUGS: LegalSlug[] = ["mentions", "confidentialite", "conditions", "cookies"];

interface LegalPage {
  title: string;
  sections: [string, string[]][];
}

export const LEGAL: Record<Lang, Record<LegalSlug, LegalPage>> = {
  fr: {
    mentions: {
      title: "Mentions légales",
      sections: [
        ["Éditeur", ["[NOM DE L'ÉDITEUR]", "Numéro d'entreprise (BCE) : [NUMÉRO BCE]", "Adresse : [ADRESSE]", "Contact : [E-MAIL DE CONTACT]"]],
        ["Hébergement", ["Le site est hébergé par Vercel Inc. Les comptes sont gérés par Supabase, sur des serveurs situés dans l'Union européenne (Irlande)."]],
        ["Offres d'emploi", ["Les offres proviennent de sources tierces : Le Forem (données ouvertes publiées sur le portail ODWB, licence CC BY-SA 4.0), Adzuna et les pages carrières publiques d'entreprises. Chaque offre renvoie vers l'annonce d'origine. L'éditeur n'est pas l'auteur de ces annonces et ne garantit ni leur exactitude ni leur disponibilité."]],
      ],
    },
    confidentialite: {
      title: "Politique de confidentialité",
      sections: [
        ["Responsable du traitement", ["[NOM DE L'ÉDITEUR], [ADRESSE], [E-MAIL DE CONTACT]."]],
        ["Données traitées", ["Identité : prénom, nom, e-mail, téléphone (facultatif), date de naissance.", "Résidence : adresse en Belgique et déclaration sur l'honneur.", "Recherche : métier, niveau d'études, compétences, langues, contrats souhaités, distance.", "CV : le texte extrait de ton CV. Le fichier PDF déposé dans ton profil reste dans ton navigateur.", "Suivi : offres gardées ou écartées, statuts, notes et dates de relance."]],
        ["Finalités et base légale", ["Te proposer des offres adaptées et suivre tes candidatures, sur la base de ton consentement et de l'exécution du service.", "Vérifier que le service est utilisé par des personnes de 16 à 35 ans résidant en Belgique."]],
        ["Où sont tes données", ["Sans compte, tes données restent dans ton navigateur.", "Avec un compte, elles sont conservées chez Supabase, dans l'Union européenne. Chaque personne n'a accès qu'à ses propres données.", "Le site est hébergé par Vercel, qui traite les données techniques de connexion."]],
        ["Tes préférences", ["Le site retient dans ton navigateur les types d'offres que tu gardes ou écartes. Ces compteurs servent à trier tes offres et ne sont pas conservés sur nos serveurs. Tu peux les effacer dans ton profil."]],
        ["Intelligence artificielle", ["Par défaut, aucune donnée n'est envoyée à une IA. Si tu coches la case prévue à l'inscription et que ce service est activé, le texte de ton CV, sans tes coordonnées, est envoyé à Anthropic pour remplir ton profil."]],
        ["Partage", ["Tes données ne sont pas vendues. Quand tu postules, c'est toi qui transmets ta candidature sur le site de l'annonce."]],
        ["Durée de conservation", ["Tes données sont conservées tant que ton compte existe. Elles sont supprimées quand tu supprimes ton compte."]],
        ["Âge minimum", ["Le service est réservé aux personnes de 16 ans et plus."]],
        ["Tes droits", ["Tu peux accéder à tes données, les corriger, les télécharger et les supprimer depuis ta page Profil. Tu peux aussi retirer ton consentement ou t'opposer à un traitement en écrivant à [E-MAIL DE CONTACT].", "Tu peux introduire une plainte auprès de l'Autorité de protection des données (autoriteprotectiondonnees.be)."]],
      ],
    },
    conditions: {
      title: "Conditions d'utilisation",
      sections: [
        ["Service", ["Ce site rassemble des offres d'emploi publiées par des tiers et t'aide à organiser ta recherche. Il ne garantit pas l'obtention d'un emploi."]],
        ["Accès", ["Le service est réservé aux personnes de 16 à 35 ans qui résident en Belgique. Tu t'engages à donner des informations exactes."]],
        ["Candidatures", ["Le site n'envoie aucune candidature à ta place. Tu restes responsable de ce que tu transmets aux employeurs. Vérifie toujours l'annonce d'origine : le contrat, la langue, le lieu et le score affichés sont des estimations."]],
        ["Usage interdit", ["Il est interdit d'utiliser le service pour collecter des données, l'aspirer ou en perturber le fonctionnement."]],
        ["Responsabilité", ["Le service est fourni tel quel, dans le cadre d'un prototype, et peut être modifié ou interrompu. L'éditeur n'est pas responsable du contenu des annonces ni des sites tiers."]],
        ["Droit applicable", ["Ces conditions sont soumises au droit belge."]],
      ],
    },
    cookies: {
      title: "Cookies et stockage",
      sections: [
        ["Ce que nous utilisons", ["Le site n'utilise ni cookie publicitaire ni outil de mesure d'audience.", "Il utilise le stockage de ton navigateur pour ton profil, tes candidatures, tes filtres, ton mail type et ton CV, ainsi que pour garder ta session de connexion. Ce stockage est nécessaire au fonctionnement du service."]],
        ["Tout effacer", ["Tu peux tout effacer depuis ta page Profil ou dans les réglages de ton navigateur."]],
      ],
    },
  },
  nl: {
    mentions: {
      title: "Wettelijke vermeldingen",
      sections: [
        ["Uitgever", ["[NOM DE L'ÉDITEUR]", "Ondernemingsnummer (KBO): [NUMÉRO BCE]", "Adres: [ADRESSE]", "Contact: [E-MAIL DE CONTACT]"]],
        ["Hosting", ["De site wordt gehost door Vercel Inc. Accounts worden beheerd door Supabase, op servers in de Europese Unie (Ierland)."]],
        ["Vacatures", ["Vacatures komen van derden: Le Forem (open data op het ODWB-portaal, licentie CC BY-SA 4.0), Adzuna en openbare carrièrepagina's van bedrijven. Elke vacature verwijst naar de oorspronkelijke advertentie. De uitgever is niet de auteur van deze advertenties en garandeert hun juistheid of beschikbaarheid niet."]],
      ],
    },
    confidentialite: {
      title: "Privacybeleid",
      sections: [
        ["Verwerkingsverantwoordelijke", ["[NOM DE L'ÉDITEUR], [ADRESSE], [E-MAIL DE CONTACT]."]],
        ["Verwerkte gegevens", ["Identiteit: voornaam, naam, e-mail, telefoon (optioneel), geboortedatum.", "Woonplaats: adres in België en verklaring op eer.", "Zoektocht: beroep, opleidingsniveau, vaardigheden, talen, gewenste contracten, afstand.", "Cv: de tekst uit je cv. Het pdf-bestand in je profiel blijft in je browser.", "Opvolging: bewaarde of overgeslagen vacatures, statussen, notities en herinneringen."]],
        ["Doeleinden en rechtsgrond", ["Je passende vacatures tonen en je sollicitaties opvolgen, op basis van je toestemming en de uitvoering van de dienst.", "Nagaan dat de dienst wordt gebruikt door personen van 16 tot 35 jaar die in België wonen."]],
        ["Waar je gegevens staan", ["Zonder account blijven je gegevens in je browser.", "Met een account worden ze bewaard bij Supabase, in de Europese Unie. Iedereen heeft enkel toegang tot zijn eigen gegevens.", "De site wordt gehost door Vercel, dat technische verbindingsgegevens verwerkt."]],
        ["Je voorkeuren", ["De site onthoudt in je browser welke soorten vacatures je bewaart of overslaat. Die tellers dienen om je vacatures te sorteren en worden niet op onze servers bewaard. Je kunt ze wissen in je profiel."]],
        ["Artificiële intelligentie", ["Standaard gaan er geen gegevens naar een AI. Als je het vakje bij de inschrijving aanvinkt en deze dienst actief is, wordt de tekst van je cv, zonder contactgegevens, naar Anthropic gestuurd om je profiel in te vullen."]],
        ["Delen", ["Je gegevens worden niet verkocht. Wanneer je solliciteert, bezorg jij je kandidatuur zelf op de site van de vacature."]],
        ["Bewaartermijn", ["Je gegevens worden bewaard zolang je account bestaat. Ze worden gewist wanneer je je account verwijdert."]],
        ["Minimumleeftijd", ["De dienst is voorbehouden aan personen vanaf 16 jaar."]],
        ["Je rechten", ["Je kunt je gegevens inkijken, verbeteren, downloaden en wissen via je profielpagina. Je kunt ook je toestemming intrekken of bezwaar maken via [E-MAIL DE CONTACT].", "Je kunt klacht indienen bij de Gegevensbeschermingsautoriteit (gegevensbeschermingsautoriteit.be)."]],
      ],
    },
    conditions: {
      title: "Gebruiksvoorwaarden",
      sections: [
        ["Dienst", ["Deze site verzamelt vacatures van derden en helpt je je zoektocht te organiseren. Hij garandeert geen job."]],
        ["Toegang", ["De dienst is voorbehouden aan personen van 16 tot 35 jaar die in België wonen. Je geeft juiste informatie op."]],
        ["Sollicitaties", ["De site verstuurt geen sollicitaties in jouw plaats. Je blijft verantwoordelijk voor wat je aan werkgevers bezorgt. Controleer altijd de oorspronkelijke advertentie: contract, taal, plaats en score zijn schattingen."]],
        ["Verboden gebruik", ["Het is verboden de dienst te gebruiken om gegevens te verzamelen of de werking ervan te verstoren."]],
        ["Aansprakelijkheid", ["De dienst wordt geleverd zoals hij is, als prototype, en kan worden gewijzigd of stopgezet. De uitgever is niet verantwoordelijk voor de inhoud van advertenties of sites van derden."]],
        ["Toepasselijk recht", ["Deze voorwaarden vallen onder het Belgische recht."]],
      ],
    },
    cookies: {
      title: "Cookies en opslag",
      sections: [
        ["Wat we gebruiken", ["De site gebruikt geen advertentiecookies of bezoekersmeting.", "Hij gebruikt de opslag van je browser voor je profiel, sollicitaties, filters, standaardmail en cv, en om je ingelogd te houden. Deze opslag is nodig voor de werking van de dienst."]],
        ["Alles wissen", ["Je kunt alles wissen via je profielpagina of de instellingen van je browser."]],
      ],
    },
  },
};
