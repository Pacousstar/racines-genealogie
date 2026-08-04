export type DetailLienDeclaration = {
  decede: boolean;
  dateDeces: string;
} | null;

export type EnfantDeclaration = {
  id: string;
  date_naissance: string;
  decede: boolean;
  date_deces: string;
};