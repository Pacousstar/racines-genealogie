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
// Dès que la disposition réelle des quartiers de Toa-Zéo sera connue,
// remplacer ces coordonnées (x, y = coin supérieur gauche du quartier).
export const POSITIONS_QUARTIERS: PositionQuartier[] = [
  { nom: "Quartier Centre", x: 340, y: 250, largeur: 300, hauteur: 200 },
  { nom: "Quartier Nord", x: 340, y: 40, largeur: 300, hauteur: 160 },
  { nom: "Quartier Sud", x: 340, y: 500, largeur: 300, hauteur: 170 },
  { nom: "Quartier Est", x: 700, y: 250, largeur: 250, hauteur: 200 },
  { nom: "Quartier Fondateurs", x: 50, y: 250, largeur: 240, hauteur: 200 },
  { nom: "Gbéya", x: 50, y: 500, largeur: 240, hauteur: 160 },
  { nom: "Bonyé", x: 700, y: 40, largeur: 250, hauteur: 160 },
];