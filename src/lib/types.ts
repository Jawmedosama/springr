export type Lang = "fr" | "nl";

export type Region = "bruxelles" | "wallonie" | "flandre";

export type ContractType =
  | "etudiant"
  | "stage"
  | "alternance"
  | "cdd"
  | "cdi"
  | "interim";

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
}
