export type PositionQuartier = {
  nom: string;
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
};

export const LARGEUR_PLAN = 1000;
export const HAUTEUR_PLAN = 750;

// Disposition réelle fournie pour Toa-Zéo :
// Nord en haut, entrée du village au Sud.
// - Gaho : entrée sud, côté droit
// - Bogné : entrée sud, côté gauche
// - Bogné-Zagna : centre, côté gauche
// - Zouahé : nord, à droite
// (x, y = coin supérieur gauche du quartier sur le plan 1000 × 750)
export const POSITIONS_QUARTIERS: PositionQuartier[] = [
  { nom: "Zouahé", x: 650, y: 40, largeur: 280, hauteur: 170 },
  { nom: "Bogné-Zagna", x: 50, y: 280, largeur: 280, hauteur: 170 },
  { nom: "Bogné", x: 50, y: 530, largeur: 280, hauteur: 170 },
  { nom: "Gaho", x: 650, y: 530, largeur: 280, hauteur: 170 },
];