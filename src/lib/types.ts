export type Lang = "fr" | "nl";

export type Region = "bruxelles" | "wallonie" | "flandre";

export type Province =
  | "anvers" | "brabant-flamand" | "brabant-wallon" | "flandre-occidentale" | "flandre-orientale"
  | "hainaut" | "liege" | "limbourg" | "luxembourg" | "namur";

export type ContractType =
  | "etudiant"
  | "flexi"
  | "stage"
  | "alternance"
  | "cdd"
  | "cdi"
  | "interim"
  /** Le contrat n'est pas indiqué par la source. */
  | "nc";

export interface Offer {
  id: string;
  title: string;
  company: string;
  city: string;
  postcode?: string;
  region?: Region;
  province?: Province;
  contract: ContractType;
  description: string;
  language?: Lang | "de" | "en";
  url: string;
  source: string;
  publishedAt: string;
  salary?: string;
  /** Publiée par une agence ou un intermédiaire. */
  agency?: boolean;
}

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  /** Jamais envoyé à l'IA. */
  phone?: string;
  birthDate: string;
  street: string;
  number: string;
  postcode: string;
  city: string;
  region: Region;
  declaredResident: boolean;
  studyLevel: string;
  field: string;
  skills: string[];
  languages: string[];
  contracts: ContractType[];
  mobilityKm: number;
  /** Texte du CV collé par l'utilisateur, utilisé pour le score et les candidatures IA. */
  cvText?: string;
  createdAt: string;
}

/** Ce qui sert à calculer le score : ni adresse, ni e-mail, ni date de naissance. */
export type MatchProfile = Pick<Profile, "contracts" | "region" | "skills" | "field" | "languages" | "cvText">;

export type ApplicationStatus =
  | "a_postuler"
  | "envoyee"
  | "entretien"
  | "refusee"
  | "acceptee";

export interface Application {
  offer: Offer;
  status: ApplicationStatus;
  updatedAt: string;
  remindAt?: string;
  notes?: string;
  letter?: string;
  cv?: string;
  /** Candidature spontanée (marché caché) plutôt qu'une réponse à une offre. */
  spontaneous?: boolean;
}

