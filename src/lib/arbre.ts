export type IdentitePersonne = {
  nom: string;
  prenom: string | null;
  sexe: string | null;
  date_naissance: string | null;
  date_deces: string | null;
  vivant: boolean | null;
};

export type Personne = IdentitePersonne & {
  id: string;
  surnom: string | null;
  quartier_id: string | null;
  famille_id: string | null;
  photo_url: string | null;
  est_ancetre: boolean | null;
  est_fondateur: boolean | null;
  fiabilite: string | null;
  source: string | null;
  notes: string | null;
};

export type LienEnfant = {
  parent_id: string;
  enfant_id: string;
  rang: number | null;
};

export type Union = {
  conjoint_1: string;
  conjoint_2: string;
  date_union: string | null;
};

export type Filtre = {
  chercher: string;
  quartier: string;
  vivant: string;
  fiabilite: string;
};

export const FILTRE_VIDE: Filtre = {
  chercher: "",
  quartier: "tous",
  vivant: "tous",
  fiabilite: "tous",
};

export type ArbreNoeud = {
  personne: Personne;
  conjoint: Personne | null;
  enfants: ArbreNoeud[];
  profondeur: number;
};

function anneeDe(d: string | null | undefined): number | null {
  if (!d) return null;
  const m = d.match(/\d{4}/);
  return m ? Number(m[1]) : null;
}

export function nomComplet(p: IdentitePersonne): string {
  return [p.prenom, p.nom].filter(Boolean).join(" ").trim();
}

export function initiales(p: IdentitePersonne): string {
  const pre = p.prenom ? p.prenom.charAt(0) : "";
  const nom = p.nom ? p.nom.charAt(0) : "";
  return (pre + nom).toUpperCase();
}

export function periode(p: IdentitePersonne): string {
  const n = p.date_naissance ?? "";
  const d = p.date_deces ?? "";
  if (p.vivant === false) {
    return n || d ? [n, d].filter(Boolean).join(" – ") : "décédé";
  }
  if (n) return `né${p.sexe === "F" ? "e" : ""} ${n}`;
  if (d) return `décédé ${d}`;
  return "";
}

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function estAncetre(p: Personne): boolean {
  return p.est_ancetre === true || p.est_fondateur === true;
}

export function construitArbre(
  personnes: Personne[],
  liens: LienEnfant[],
  unions: Union[]
): ArbreNoeud[] {
  const parId = new Map<string, Personne>();
  for (const p of personnes) parId.set(p.id, p);

  const enfantsDe = new Map<string, Map<string, number>>();
  for (const l of liens) {
    if (!enfantsDe.has(l.parent_id)) enfantsDe.set(l.parent_id, new Map());
    const m = enfantsDe.get(l.parent_id)!;
    m.set(l.enfant_id, l.rang ?? Number.MAX_SAFE_INTEGER);
  }

  const partenaireDe = new Map<string, string>();
  for (const u of unions) {
    partenaireDe.set(u.conjoint_1, u.conjoint_2);
    partenaireDe.set(u.conjoint_2, u.conjoint_1);
  }

  const memo = new Map<string, ArbreNoeud>();

  const construire = (
    id: string,
    visite: Set<string>,
    profondeur: number
  ): ArbreNoeud | null => {
    const cache = memo.get(id);
    if (cache) return cache;
    if (visite.has(id) || profondeur > 40) return null;

    const p = parId.get(id);
    if (!p) return null;

    const nouveauVisite = new Set(visite);
    nouveauVisite.add(id);

    const partenaireId = partenaireDe.get(id);
    const conjoint = partenaireId ? parId.get(partenaireId) ?? null : null;
    if (partenaireId) nouveauVisite.add(partenaireId);

    // Enfants du COUPLE : union des enfants du parent et de son/sa conjoint(e),
    // pour qu'un enfant relié à la mère seulement apparaisse quand même sous le père.
    const enfantsDuCouple = new Map<string, number>();
    const ajouterEnfants = (parentId: string) => {
      for (const [enfantId, rang] of enfantsDe.get(parentId) ?? []) {
        enfantsDuCouple.set(enfantId, Math.min(enfantsDuCouple.get(enfantId) ?? rang, rang));
      }
    };
    ajouterEnfants(id);
    if (partenaireId) ajouterEnfants(partenaireId);

    const enfants = Array.from(enfantsDuCouple)
      .map(([enfantId, rang]) => {
        const enfant = parId.get(enfantId);
        return enfant ? { enfant, rang } : null;
      })
      .filter((x): x is { enfant: Personne; rang: number } => x !== null)
      .sort(
        (a, b) =>
          a.rang - b.rang ||
          (anneeDe(a.enfant.date_naissance) ?? 99999) -
            (anneeDe(b.enfant.date_naissance) ?? 99999) ||
          nomComplet(a.enfant).localeCompare(nomComplet(b.enfant))
      )
      .map(({ enfant }) => construire(enfant.id, nouveauVisite, profondeur + 1))
      .filter((n): n is ArbreNoeud => n !== null);

    const noeud: ArbreNoeud = { personne: p, conjoint, enfants, profondeur };
    memo.set(id, noeud);
    return noeud;
  };

  const enfantsConnus = new Set<string>();
  for (const m of enfantsDe.values()) for (const id of m.keys()) enfantsConnus.add(id);

  const racines = [...new Set([...personnes])]
    .sort(
      (a, b) =>
        Number(b.est_ancetre === true) - Number(a.est_ancetre === true) ||
        nomComplet(a).localeCompare(nomComplet(b))
    )
    .filter((p) => p.est_ancetre === true || !enfantsConnus.has(p.id));

  const visiteGlobale = new Set<string>();
  const resultat: ArbreNoeud[] = [];
  for (const r of racines) {
    const n = construire(r.id, visiteGlobale, 0);
    if (n) resultat.push(n);
  }
  return resultat;
}

export function matchPersonne(p: Personne, f: Filtre): boolean {
  if (f.chercher.trim()) {
    const q = normalise(f.chercher.trim());
    const hay = normalise([p.prenom, p.nom, p.surnom].filter(Boolean).join(" "));
    if (!hay.includes(q)) return false;
  }
  if (f.quartier !== "tous" && p.quartier_id !== f.quartier) return false;
  if (f.vivant !== "tous") {
    const vivant = p.vivant !== false;
    if (f.vivant === "vivants" && !vivant) return false;
    if (f.vivant === "decedes" && vivant) return false;
  }
  if (f.fiabilite !== "tous" && p.fiabilite !== f.fiabilite) return false;
  return true;
}

export function prunerArbre(
  noeud: ArbreNoeud,
  match: (p: Personne) => boolean
): ArbreNoeud | null {
  const enfants = noeud.enfants
    .map((e) => prunerArbre(e, match))
    .filter((n): n is ArbreNoeud => n !== null);
  const garde = match(noeud.personne) || enfants.length > 0;
  return garde ? { ...noeud, enfants } : null;
}