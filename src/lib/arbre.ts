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
  rang?: number | null;
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

// Un conjoint secondaire : la personne reliée (autre que le conjoint
// principal) et les enfants qu'elle a eus AVEC cette personne
// (père + mère tous deux reliés à l'enfant).
export type AutreCouple = {
  conjoint: Personne;
  enfants: ArbreNoeud[];
};

export type ArbreNoeud = {
  personne: Personne;
  conjoint: Personne | null;
  autresConjoints: AutreCouple[];
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

// Libellé d'affichage d'une famille : préfixe « Famille » ajouté une seule
// fois (les anciens enregistrements contiennent déjà « Famille X »).
export function libelleFamille(nom: string): string {
  return /^Famille\s+/i.test(nom) ? nom : `Famille ${nom}`;
}

export function construitArbre(
  personnes: Personne[],
  liens: LienEnfant[],
  unions: Union[]
): ArbreNoeud[] {
  const parId = new Map<string, Personne>();
  for (const p of personnes) parId.set(p.id, p);

  const enfantsDe = new Map<string, Map<string, number>>();
  const parentsDe = new Map<string, Set<string>>();
  for (const l of liens) {
    if (!enfantsDe.has(l.parent_id)) enfantsDe.set(l.parent_id, new Map());
    const m = enfantsDe.get(l.parent_id)!;
    m.set(l.enfant_id, l.rang ?? Number.MAX_SAFE_INTEGER);
    if (!parentsDe.has(l.enfant_id)) parentsDe.set(l.enfant_id, new Set());
    parentsDe.get(l.enfant_id)!.add(l.parent_id);
  }

  // Conjoints déclarés (unions), triés par rang croissant : le premier rang
  // est le « conjoint principal » (affiché en couple dans l'arbre).
  const declareDe = new Map<string, Array<{ id: string; rang: number }>>();
  for (const u of unions) {
    const { conjoint_1: a, conjoint_2: b } = u;
    if (a === b || !parId.has(a) || !parId.has(b)) continue;
    const r = u.rang ?? Number.MAX_SAFE_INTEGER;
    if (!declareDe.has(a)) declareDe.set(a, []);
    declareDe.get(a)!.push({ id: b, rang: r });
    if (!declareDe.has(b)) declareDe.set(b, []);
    declareDe.get(b)!.push({ id: a, rang: r });
  }
  for (const liste of declareDe.values()) {
    liste.sort((x, y) => x.rang - y.rang || x.id.localeCompare(y.id));
  }

  // Parents d'un même enfant sans union déclarée : considérés comme conjoints
  // afin d'afficher père et mère côte à côte (avec leurs enfants sous le couple).
  const infererPartenaires = (id: string): string[] => {
    const deja = new Set((declareDe.get(id) ?? []).map((c) => c.id));
    const p = parId.get(id);
    if (!p) return [];
    const ids: string[] = [];
    for (const eid of enfantsDe.get(id)?.keys() ?? []) {
      for (const coparentId of parentsDe.get(eid) ?? []) {
        if (coparentId === id || deja.has(coparentId) || !parId.get(coparentId)) continue;
        if (ids.includes(coparentId)) continue;
        const cp = parId.get(coparentId)!;
        // On privilégie le parent de sexe opposé ; à défaut, tout co-parent.
        if (p.sexe && cp.sexe && p.sexe !== cp.sexe) {
          ids.unshift(coparentId);
        } else {
          ids.push(coparentId);
        }
      }
    }
    return ids;
  };

  const memoire = new Map<string, ArbreNoeud>();

  const construire = (
    id: string,
    visite: Set<string>,
    profondeur: number
  ): ArbreNoeud | null => {
    const cache = memoire.get(id);
    if (cache) return cache;
    if (visite.has(id) || profondeur > 40) return null;

    const p = parId.get(id);
    if (!p) return null;

    const nouveauVisite = new Set(visite);
    nouveauVisite.add(id);

    const partenairesIds = [
      ...(declareDe.get(id) ?? [])
        .map((c) => (parId.has(c.id) ? c.id : null))
        .filter((c): c is string => c !== null),
      ...infererPartenaires(id),
    ];

    const principalId = partenairesIds[0] ?? null;
    const conjoint = principalId ? parId.get(principalId) ?? null : null;
    if (conjoint) nouveauVisite.add(conjoint.id);
    const autresIds = partenairesIds.slice(1);

    // Chaque enfant de cette personne appartient au couple formé avec l'autre
    // parent, quand cet autre parent est bien l'un de ses conjoints.
    const parCouple = new Map<string, Map<string, number>>();
    const sansAutreParent = new Map<string, number>();
    const parentsDeEnfant = (eid: string) => parentsDe.get(eid) ?? new Set<string>();

    for (const [eid, rang] of enfantsDe.get(id) ?? []) {
      const generateur = partenairesIds.find((pid) => parentsDeEnfant(eid).has(pid));
      if (generateur) {
        if (!parCouple.has(generateur)) parCouple.set(generateur, new Map());
        parCouple.get(generateur)!.set(eid, rang);
      } else {
        sansAutreParent.set(eid, rang);
      }
    }

    const trierEtConstruire = (enfants: Map<string, number>) =>
      Array.from(enfants)
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

    // Enfants du couple principal : ceux partagés avec le conjoint principal,
    // plus ceux dont aucun autre parent déclaré n'est conjoint.
    const enfantsPrincipal = new Map<string, number>(sansAutreParent);
    if (principalId && parCouple.has(principalId)) {
      for (const [eid, rang] of parCouple.get(principalId)!) {
        enfantsPrincipal.set(eid, rang);
      }
    }

    const autresConjoints: AutreCouple[] = [];
    for (const autreId of autresIds) {
      const autresCParent = parCouple.get(autreId);
      const autre = parId.get(autreId);
      if (!autre) continue;
      autresConjoints.push({
        conjoint: autre,
        enfants: autresCParent
          ? trierEtConstruire(autresCParent)
          : [],
      });
    }

    const noeud: ArbreNoeud = {
      personne: p,
      conjoint,
      autresConjoints,
      enfants: trierEtConstruire(enfantsPrincipal),
      profondeur,
    };
    memoire.set(id, noeud);
    return noeud;
  };

  const enfantsConnus = new Set<string>();
  for (const m of enfantsDe.values()) for (const id of m.keys()) enfantsConnus.add(id);

  // Racines : les ancêtres déclarés (★) en premier, puis les personnes sans
  // parents. Une personne déjà couverte (conjoint ou co-parent apparié, ou
  // descendant d'une racine affichée) n'est jamais affichée deux fois.
  const racines = [...new Set([...personnes])]
    .sort(
      (a, b) =>
        Number(estAncetre(b)) - Number(estAncetre(a)) ||
        nomComplet(a).localeCompare(nomComplet(b))
    )
    .filter((p) => estAncetre(p) || !enfantsConnus.has(p.id));

  const couverts = new Set<string>();
  const couvrir = (n: ArbreNoeud) => {
    couverts.add(n.personne.id);
    if (n.conjoint) couverts.add(n.conjoint.id);
    for (const a of n.autresConjoints) couverts.add(a.conjoint.id);
    for (const e of n.enfants) couvrir(e);
    for (const a of n.autresConjoints) for (const e of a.enfants) couvrir(e);
  };

  const visiteGlobale = new Set<string>();
  const resultat: ArbreNoeud[] = [];
  for (const r of racines) {
    if (couverts.has(r.id)) continue;
    const n = construire(r.id, visiteGlobale, 0);
    if (n) {
      resultat.push(n);
      couvrir(n);
    }
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
  const autresConjoints = noeud.autresConjoints
    .map((a) => ({
      conjoint: a.conjoint,
      enfants: a.enfants
        .map((e) => prunerArbre(e, match))
        .filter((n): n is ArbreNoeud => n !== null),
    }))
    .filter(
      (a) =>
        a.enfants.length > 0 ||
        match(a.conjoint)
    );
  const garde =
    match(noeud.personne) ||
    enfants.length > 0 ||
    autresConjoints.length > 0 ||
    Boolean(noeud.conjoint && match(noeud.conjoint));
  return garde ? { ...noeud, enfants, autresConjoints } : null;
}

// Tous les descendants d'une personne (via les liens parent -> enfant).
// N'inclut pas la personne elle-même.
export function descendantsDe(id: string, liens: LienEnfant[]): Set<string> {
  const enfantsDe = new Map<string, string[]>();
  for (const l of liens) {
    if (!enfantsDe.has(l.parent_id)) enfantsDe.set(l.parent_id, []);
    enfantsDe.get(l.parent_id)!.push(l.enfant_id);
  }
  const sortis = new Set<string>();
  const file = [id];
  while (file.length > 0) {
    const courant = file.pop()!;
    for (const e of enfantsDe.get(courant) ?? []) {
      if (sortis.has(e)) continue;
      sortis.add(e);
      file.push(e);
    }
  }
  return sortis;
}

// Tous les ascendants d'une personne (via les liens enfant -> parent).
// N'inclut pas la personne elle-même.
export function ascendantsDe(id: string, liens: LienEnfant[]): Set<string> {
  const parentsDe = new Map<string, string[]>();
  for (const l of liens) {
    if (!parentsDe.has(l.enfant_id)) parentsDe.set(l.enfant_id, []);
    parentsDe.get(l.enfant_id)!.push(l.parent_id);
  }
  const sortis = new Set<string>();
  const file = [id];
  while (file.length > 0) {
    const courant = file.pop()!;
    for (const p of parentsDe.get(courant) ?? []) {
      if (sortis.has(p)) continue;
      sortis.add(p);
      file.push(p);
    }
  }
  return sortis;
}

// Limite l'affichage à `maxProfondeur` générations depuis la racine :
// profondeur 0 = la racine, 1 = ses enfants, etc.
export function clipperGenerations(
  noeud: ArbreNoeud,
  maxProfondeur: number
): ArbreNoeud {
  if (noeud.profondeur >= maxProfondeur) {
    return { ...noeud, enfants: [], autresConjoints: [] };
  }
  return {
    ...noeud,
    enfants: noeud.enfants.map((e) => clipperGenerations(e, maxProfondeur)),
    autresConjoints: noeud.autresConjoints.map((a) => ({
      ...a,
      enfants: a.enfants.map((e) => clipperGenerations(e, maxProfondeur)),
    })),
  };
}