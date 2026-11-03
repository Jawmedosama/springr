export type Lang = "fr" | "nl";

export type Region = "bruxelles" | "wallonie" | "flandre";

export type ContractType =
  | "etudiant"
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
  contract: ContractType;
  description: string;
  language?: Lang | "de" | "en";
  url: string;
  source: string;
  publishedAt: string;
  salary?: string;
}

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
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

/** Ce qui est envoyé à l'IA : jamais l'adresse, l'e-mail ni la date de naissance. */
export type AiProfile = Pick<Profile, "firstName" | "lastName" | "studyLevel" | "field" | "skills" | "languages" | "cvText">;

export function toAiProfile(p: Profile): AiProfile {
  const { firstName, lastName, studyLevel, field, skills, languages, cvText } = p;
  return { firstName, lastName, studyLevel, field, skills, languages, cvText };
}
