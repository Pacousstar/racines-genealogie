export type PositionQuartier = {
  nom: string;
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
};

export const LARGEUR_PLAN = 1000;
export const HAUTEUR_PLAN = 750;

// Plan provisoire : les positions ci-dessous sont UNIQUEMENT provisoires.
// Dès que la disposition réelle des quartiers de Toa-Zéo sera connue (à venir),
// remplacer ces coordonnées (x, y = coin supérieur gauche du quartier).
export const POSITIONS_QUARTIERS: PositionQuartier[] = [
  { nom: "Gaho", x: 360, y: 250, largeur: 280, hauteur: 190 },
  { nom: "Bogné", x: 360, y: 40, largeur: 280, hauteur: 150 },
  { nom: "Bogné-Zagna", x: 690, y: 70, largeur: 260, hauteur: 150 },
  { nom: "Gbéha", x: 60, y: 260, largeur: 240, hauteur: 190 },
  { nom: "Zouahé", x: 360, y: 500, largeur: 280, hauteur: 180 },
];