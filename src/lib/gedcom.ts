export type GedcomPersonne = {
  id: string;
  nom: string;
  prenom: string | null;
  surnom: string | null;
  sexe: string | null;
  date_naissance: string | null;
  date_deces: string | null;
  vivant: boolean | null;
  source: string | null;
};

export type GedcomLien = { parent_id: string; enfant_id: string };

export type GedcomUnion = {
  conjoint_1: string;
  conjoint_2: string;
  date_union: string | null;
};

function assainir(valeur: string | null | undefined): string {
  return (valeur ?? "").replace(/[\r\n\t]+/g, " ").trim();
}

export function genererGedcom(
  personnes: GedcomPersonne[],
  liens: GedcomLien[],
  unions: GedcomUnion[]
): string {
  const ordre = [...personnes].sort((a, b) =>
    [a.nom, a.prenom ?? "", a.id]
      .join("|")
      .localeCompare([b.nom, b.prenom ?? "", b.id].join("|"))
  );
  const refParId = new Map<string, string>();
  ordre.forEach((p, i) => refParId.set(p.id, `@I${i + 1}@`));

  const partenaireDe = new Map<string, string>();
  const unionDe = new Map<string, string>();
  const unionParCle = new Map<string, GedcomUnion>();
  const refsUnions = new Map<string, string>();
  unions.forEach((u, i) => {
    partenaireDe.set(u.conjoint_1, u.conjoint_2);
    partenaireDe.set(u.conjoint_2, u.conjoint_1);
    const cle = [u.conjoint_1, u.conjoint_2].sort().join("|");
    const ref = `@F${i + 1}@`;
    unionParCle.set(cle, u);
    unionDe.set(u.conjoint_1, ref);
    unionDe.set(u.conjoint_2, ref);
    refsUnions.set(cle, ref);
  });

  const parentsDe = new Map<string, string[]>();
  for (const l of liens) {
    const liste = parentsDe.get(l.enfant_id) ?? [];
    liste.push(l.parent_id);
    parentsDe.set(l.enfant_id, liste);
  }

  const sexeDe = new Map(personnes.map((p) => [p.id, p.sexe]));

  const familleDe = new Map<string, string>();
  for (const l of liens) {
    const parents = parentsDe.get(l.enfant_id) ?? [];
    let famille: string | null = null;
    for (const parent of parents) {
      const partenaire = partenaireDe.get(parent);
      if (partenaire && parents.includes(partenaire)) {
        famille = unionDe.get(parent) ?? null;
        if (famille) break;
      }
    }
    if (!famille) {
      const mere = parents.find((pid) => sexeDe.get(pid) === "F");
      const pere = mere
        ? parents.find((pid) => pid !== mere && sexeDe.get(pid) === "M")
        : parents.find((pid) => sexeDe.get(pid) === "M");
      famille =
        (mere ? unionDe.get(mere) : null) ??
        (pere ? unionDe.get(pere) : null) ??
        null;
    }
    if (famille) familleDe.set(l.enfant_id, famille);
  }

  const lignes: string[] = [];
  lignes.push("0 HEAD");
  lignes.push("1 SOUR Généalogie Toa-Zéo");
  lignes.push("2 NAME Généalogie Toa-Zéo");
  lignes.push("1 GEDC");
  lignes.push("2 VERS 7.0");
  lignes.push("2 FORM LINEAGE-LINKED");
  lignes.push("1 CHAR UTF-8");
  lignes.push("1 LANG fr");

  for (const p of ordre) {
    const ref = refParId.get(p.id)!;
    const nom = assainir(p.nom);
    const prenom = assainir(p.prenom);
    lignes.push(`0 ${ref} INDI`);
    lignes.push(
      `1 NAME ${prenom ? `${prenom} ` : ""}/${nom.toUpperCase()}/`
    );
    if (p.sexe) lignes.push(`1 SEX ${p.sexe === "F" ? "F" : "M"}`);
    if (p.date_naissance) {
      lignes.push("1 BIRT");
      lignes.push(`2 DATE ${assainir(p.date_naissance)}`);
    }
    if (p.vivant === false) {
      lignes.push("1 DEAT");
      if (p.date_deces) lignes.push(`2 DATE ${assainir(p.date_deces)}`);
      else lignes.push("2 Y");
    }
    const famc = familleDe.get(p.id);
    if (famc) lignes.push(`1 FAMC ${famc}`);
    const fams = unionDe.get(p.id);
    if (fams) lignes.push(`1 FAMS ${fams}`);
    if (p.source) lignes.push(`1 NOTE ${assainir(p.source)}`);
  }

  for (const u of unions) {
    const cle = [u.conjoint_1, u.conjoint_2].sort().join("|");
    const ref = refsUnions.get(cle)!;
    lignes.push(`0 ${ref} FAM`);
    lignes.push(`1 HUSB ${refParId.get(u.conjoint_1)}`);
    lignes.push(`1 WIFE ${refParId.get(u.conjoint_2)}`);
    if (u.date_union) {
      lignes.push("1 MARR");
      lignes.push(`2 DATE ${assainir(u.date_union)}`);
    }
    for (const l of liens) {
      if (
        (l.parent_id === u.conjoint_1 || l.parent_id === u.conjoint_2) &&
        familleDe.get(l.enfant_id) === ref
      ) {
        lignes.push(`1 CHIL ${refParId.get(l.enfant_id)}`);
      }
    }
  }

  lignes.push("0 TRLR");
  return lignes.join("\r\n");
}
