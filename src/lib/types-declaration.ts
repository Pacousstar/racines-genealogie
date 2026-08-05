export type DetailLienDeclaration = {
  decede: boolean;
  dateDeces: string;
} | null;

export type PersonneNouvelle = {
  nom: string;
  prenom: string;
  sexe: "M" | "F" | null;
  date_naissance: string;
  date_deces: string;
  decede: boolean;
};

export type EnfantDeclaration = {
  id: string | null;
  nouveau: PersonneNouvelle | null;
  date_naissance: string;
  decede: boolean;
  date_deces: string;
};
