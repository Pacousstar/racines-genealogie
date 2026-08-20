"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { obtenirOuCreerQuartier, obtenirOuCreerFamille } from "@/lib/nomenclature";
import type {
  ConjointDeclaration,
  DetailLienDeclaration,
  EnfantDeclaration,
  PersonneNouvelle,
} from "@/lib/types-declaration";

export type Modification = {
  nom: string;
  prenom: string;
  surnom: string;
  sexe: "M" | "F" | null;
  vivant: boolean;
  date_naissance: string;
  date_deces: string;
  quartier_id: string | null;
  famille_id: string | null;
  photo_url: string | null;
  source: string;
  fiabilite: string;
  profession: string;
  religion: string;
  pere_id: string | null;
  mere_id: string | null;
  conjoints: ConjointDeclaration[];
  pere_nouveau: PersonneNouvelle | null;
  mere_nouveau: PersonneNouvelle | null;
  nouveau_quartier: string;
  nouvelle_famille: string;
  retraite: boolean;
  residence: string;
  crise_2010_2011: boolean;
  est_ancetre: boolean;
  pere: DetailLienDeclaration;
  mere: DetailLienDeclaration;
  enfants: EnfantDeclaration[];
};

export type ResultatModification = { erreur?: string; id?: string };

async function appliquerDetailLien(
  supabase: SupabaseClient,
  personneId: string,
  detail: DetailLienDeclaration
): Promise<void> {
  if (!detail?.decede) return;
  const patch: { vivant: boolean; date_deces?: string } = { vivant: false };
  const dateDeces = detail.dateDeces?.trim();
  if (dateDeces) patch.date_deces = dateDeces;
  await supabase.from("personnes").update(patch).eq("id", personneId);
}

async function appliquerEnfant(
  supabase: SupabaseClient,
  enfant: EnfantDeclaration
): Promise<void> {
  const patch: Record<string, string | boolean> = {};
  const naissance = enfant.date_naissance?.trim();
  if (naissance) patch.date_naissance = naissance;
  if (enfant.decede) {
    patch.vivant = false;
    const deces = enfant.date_deces?.trim();
    if (deces) patch.date_deces = deces;
  }
  if (Object.keys(patch).length > 0) {
    await supabase.from("personnes").update(patch).eq("id", enfant.id);
  }
}

async function creerNouvellePersonne(
  supabase: SupabaseClient,
  n: PersonneNouvelle,
  source: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("personnes")
    .insert({
      nom: n.nom.trim(),
      prenom: n.prenom?.trim() || null,
      sexe: n.sexe,
      vivant: !n.decede,
      date_naissance: n.date_naissance?.trim() || null,
      date_deces: n.decede ? n.date_deces?.trim() || null : null,
      fiabilite: "confirmé",
      source,
    })
    .select("id")
    .single();
  return error || !data ? null : data.id;
}

async function insererUnion(
  supabase: SupabaseClient,
  conjointA: string,
  conjointB: string,
  rang: number
): Promise<string | null> {
  const essai = await supabase
    .from("unions")
    .insert({ conjoint_1: conjointA, conjoint_2: conjointB, type: "mariage", rang });
  if (essai.error && COLONNE_MANQUANTE.test(essai.error.message)) {
    const repli = await supabase
      .from("unions")
      .insert({ conjoint_1: conjointA, conjoint_2: conjointB, type: "mariage" });
    return repli.error ? repli.error.message : null;
  }
  return essai.error ? essai.error.message : null;
}

// Repli si les nouvelles colonnes (retraite, residence, crise_2010_2011)
// n'ont pas encore été ajoutées dans Supabase — la mise à jour reste possible.
const COLONNE_MANQUANTE = /column .* does not exist|could not find the column/i;

async function majPersonne(
  supabase: SupabaseClient,
  champsBase: Record<string, unknown>,
  nouveauxChamps: Record<string, unknown>,
  id: string
): Promise<{ error: { message: string } | null }> {
  const essai = await supabase
    .from("personnes")
    .update({ ...champsBase, ...nouveauxChamps })
    .eq("id", id);
  if (essai.error && COLONNE_MANQUANTE.test(essai.error.message)) {
    return supabase.from("personnes").update(champsBase).eq("id", id);
  }
  return essai;
}

export async function modifier(
  id: string,
  m: Modification
): Promise<ResultatModification> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non connecté. Reconnectez-vous." };

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = prof?.role;
  if (role !== "editeur" && role !== "admin") {
    return { erreur: "Réservé à un éditeur (CHO ou administrateur)." };
  }

  const nom = m.nom.trim();
  if (!nom) return { erreur: "Le nom est obligatoire." };

  const quartierId =
    (m.nouveau_quartier?.trim()
      ? await obtenirOuCreerQuartier(supabase, m.nouveau_quartier)
      : m.quartier_id) ?? null;

  const familleId =
    (m.nouvelle_famille?.trim()
      ? await obtenirOuCreerFamille(supabase, m.nouvelle_famille, quartierId)
      : m.famille_id) ?? null;

  const { error } = await majPersonne(
    supabase,
    {
      nom,
      prenom: m.prenom.trim() || null,
      surnom: m.surnom.trim() || null,
      sexe: m.sexe,
      vivant: m.vivant,
      date_naissance: m.date_naissance.trim() || null,
      date_deces: m.date_deces.trim() || null,
      quartier_id: quartierId,
      famille_id: familleId,
      photo_url: m.photo_url?.trim() || null,
      source: m.source,
      fiabilite: m.fiabilite,
      est_ancetre: m.est_ancetre,
    },
    {
      retraite: m.retraite,
      residence: m.residence.trim() || null,
      crise_2010_2011: m.crise_2010_2011,
      profession: m.profession?.trim() || null,
      religion: m.religion?.trim() || null,
    },
    id
  );

  if (error) {
    return { erreur: `Mise à jour impossible : ${error.message}` };
  }

  await supabase.from("enfants").delete().eq("enfant_id", id);

  const parents: Array<{
    cle: "pere_id" | "mere_id";
    nouveau: PersonneNouvelle | null;
  }> = [
    { cle: "pere_id", nouveau: m.pere_nouveau },
    { cle: "mere_id", nouveau: m.mere_nouveau },
  ];

  for (const { cle, nouveau } of parents) {
    let parentId = m[cle];
    if (!parentId && nouveau?.nom?.trim()) {
      parentId = await creerNouvellePersonne(supabase, nouveau, m.source);
    }
    if (parentId) {
      await supabase.from("enfants").insert({ parent_id: parentId, enfant_id: id });
      const detail = cle === "pere_id" ? m.pere : m.mere;
      await appliquerDetailLien(supabase, parentId, detail);
    }
  }

  await supabase
    .from("unions")
    .delete()
    .or(`conjoint_1.eq.${id},conjoint_2.eq.${id}`);

  // Conjoint(e)s : le premier déclaré (rang 0) est le conjoint principal.
  for (const [i, conjoint] of (m.conjoints ?? []).entries()) {
    let conjointId = conjoint.id;
    if (!conjointId && conjoint.nouveau?.nom?.trim()) {
      conjointId = await creerNouvellePersonne(supabase, conjoint.nouveau, m.source);
    }
    if (!conjointId) continue;
    const erreurUnion = await insererUnion(supabase, id, conjointId, i);
    if (erreurUnion) {
      return {
        erreur: `L'union avec le conjoint n°${i + 1} n'a pas pu être enregistrée : ${erreurUnion}`,
      };
    }
    await appliquerDetailLien(supabase, conjointId, conjoint.detail);
  }

  // Enfants : on remplace les liens parent → enfant, et pour chaque enfant on
  // réécrit aussi le lien vers son AUTRE parent (père ou mère), pour que les
  // enfants de X et de Y ne soient pas mélangés.
  await supabase.from("enfants").delete().eq("parent_id", id);

  // Enfant retiré de la déclaration : seul le lien de cette personne est
  // retiré. Le lien vers l'« autre parent » (la mère par exemple) reste,
  // car cet enfant continue de lui appartenir dans l'arbre.

  for (const [index, enfant] of (m.enfants ?? []).entries()) {
    let enfantId = enfant.id;
    if (!enfantId && enfant.nouveau?.nom?.trim()) {
      enfantId = await creerNouvellePersonne(supabase, enfant.nouveau, m.source);
    }
    if (!enfantId) continue;
    await appliquerEnfant(supabase, { ...enfant, id: enfantId });
    await supabase
      .from("enfants")
      .insert({ parent_id: id, enfant_id: enfantId, rang: index + 1 });

    let autreParentId = enfant.autre_parent_id;
    if (!autreParentId && enfant.autre_parent_nouveau?.nom?.trim()) {
      autreParentId = await creerNouvellePersonne(
        supabase,
        enfant.autre_parent_nouveau,
        m.source
      );
    }
    await supabase
      .from("enfants")
      .delete()
      .eq("enfant_id", enfantId)
      .neq("parent_id", id);
    if (autreParentId) {
      await supabase
        .from("enfants")
        .insert({ parent_id: autreParentId, enfant_id: enfantId, rang: index + 1 });
    }
  }

  try {
    await supabase.from("journal").insert({
      action: "modification",
      cible_type: "personne",
      cible_id: id,
      detail: { nom: m.nom.trim(), prenom: m.prenom.trim() || null },
    });
  } catch {
    // Table journal pas encore créée : on ignore.
  }

  return { id };
}

export async function mettrePhoto(
  id: string,
  photoUrl: string
): Promise<{ erreur?: string; id?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non connecté. Reconnectez-vous." };

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = prof?.role;
  if (role !== "editeur" && role !== "admin") {
    return { erreur: "Réservé à un éditeur (CHO ou administrateur)." };
  }

  const { error } = await supabase
    .from("personnes")
    .update({ photo_url: photoUrl })
    .eq("id", id);
  if (error) {
    return { erreur: `Mise à jour impossible : ${error.message}` };
  }
  try {
    await supabase.from("journal").insert({
      action: "photo",
      cible_type: "personne",
      cible_id: id,
    });
  } catch {
    // Table journal pas encore créée : on ignore.
  }
  return { id };
}

export type PersonneRestante = {
  id: string;
  nom: string;
  prenom: string | null;
  raison: string;
};

// Supprime la personne et, si `aussiIds` est fourni, les personnes qui n'ont
// plus aucun lien après la suppression. Renvoie les personnes liées qui se
// retrouveraient orphelines (sans parents, sans enfants, sans union) pour que
// l'interface propose de les supprimer aussi.
export async function supprimer(
  id: string,
  aussiIds: string[] = []
): Promise<{ erreur?: string; id?: string; restants?: PersonneRestante[] }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non connecté. Reconnectez-vous." };

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = prof?.role;
  if (role !== "editeur" && role !== "admin") {
    return { erreur: "Réservé à un éditeur (CHO ou administrateur)." };
  }

  const idsASupprimer = [...new Set([id, ...(aussiIds ?? [])])];

  const [personnesRes, liensRes, unionsRes] = await Promise.all([
    supabase.from("personnes").select("id,nom,prenom").in("id", idsASupprimer),
    supabase
      .from("enfants")
      .select("parent_id,enfant_id")
      .or(
        idsASupprimer.map((i) => `parent_id.eq.${i},enfant_id.eq.${i}`).join(",")
      ),
    supabase
      .from("unions")
      .select("conjoint_1,conjoint_2")
      .or(idsASupprimer.map((i) => `conjoint_1.eq.${i},conjoint_2.eq.${i}`).join(",")),
  ]);

  const parId = new Map(
    (personnesRes.data ?? []).map((p) => [p.id, p])
  );
  const nom = (pid: string) => {
    const p = parId.get(pid);
    return [p?.prenom, p?.nom].filter(Boolean).join(" ") || "Personne inconnue";
  };

  // Personnes touchées indirectement : leurs enfants et leurs conjoints.
  const touches = new Set<string>();
  for (const l of liensRes.data ?? []) {
    if (idsASupprimer.includes(l.parent_id)) touches.add(l.enfant_id);
    if (idsASupprimer.includes(l.enfant_id)) touches.add(l.parent_id);
  }
  for (const u of unionsRes.data ?? []) {
    if (idsASupprimer.includes(u.conjoint_1)) touches.add(u.conjoint_2);
    if (idsASupprimer.includes(u.conjoint_2)) touches.add(u.conjoint_1);
  }

  // Toutes les personnes à évaluer après suppression : les touchées + les
  // autres parents des enfants des supprimées.
  const enfantsIds = [...new Set(
    (liensRes.data ?? [])
      .filter((l) => idsASupprimer.includes(l.parent_id))
      .map((l) => l.enfant_id)
  )];
  const { data: coparents } = enfantsIds.length
    ? await supabase
        .from("enfants")
        .select("parent_id,enfant_id")
        .in("enfant_id", enfantsIds)
    : { data: null };
  for (const l of coparents ?? []) {
    if (!idsASupprimer.includes(l.parent_id)) touches.add(l.parent_id);
  }

  // Liens restants après suppression (hors idsASupprimer).
  const { data: tousLiens } = await supabase.from("enfants").select("*");
  const { data: toutesUnions } = await supabase.from("unions").select("*");
  const parentsDe = new Map<string, Set<string>>();
  const enfantsDe = new Map<string, Set<string>>();
  for (const l of tousLiens ?? []) {
    if (idsASupprimer.includes(l.parent_id) || idsASupprimer.includes(l.enfant_id)) continue;
    if (!parentsDe.has(l.enfant_id)) parentsDe.set(l.enfant_id, new Set());
    parentsDe.get(l.enfant_id)!.add(l.parent_id);
    if (!enfantsDe.has(l.parent_id)) enfantsDe.set(l.parent_id, new Set());
    enfantsDe.get(l.parent_id)!.add(l.enfant_id);
  }
  const conjointsDe = new Map<string, Set<string>>();
  for (const u of toutesUnions ?? []) {
    if (idsASupprimer.includes(u.conjoint_1) || idsASupprimer.includes(u.conjoint_2)) continue;
    if (!conjointsDe.has(u.conjoint_1)) conjointsDe.set(u.conjoint_1, new Set());
    conjointsDe.get(u.conjoint_1)!.add(u.conjoint_2);
    if (!conjointsDe.has(u.conjoint_2)) conjointsDe.set(u.conjoint_2, new Set());
    conjointsDe.get(u.conjoint_2)!.add(u.conjoint_1);
  }

  const restants: PersonneRestante[] = [];
  for (const t of touches) {
    if (idsASupprimer.includes(t)) continue;
    const orphelin =
      !(parentsDe.get(t)?.size) && !(enfantsDe.get(t)?.size) && !(conjointsDe.get(t)?.size);
    if (orphelin) {
      const { data: tp } = await supabase
        .from("personnes")
        .select("id,nom,prenom")
        .eq("id", t)
        .single();
      if (tp) {
        restants.push({
          id: tp.id,
          nom: tp.nom,
          prenom: tp.prenom,
          raison: "n'aura plus aucun lien dans le tableau",
        });
      }
    }
  }

  for (const sid of idsASupprimer) {
    const { error } = await supabase.from("personnes").delete().eq("id", sid);
    if (error) {
      return { erreur: `Suppression impossible : ${error.message}` };
    }
    try {
      await supabase.from("journal").insert({
        action: "suppression",
        cible_type: "personne",
        cible_id: sid,
        detail: {
          nom: parId.get(sid)?.nom ?? null,
          prenom: parId.get(sid)?.prenom ?? null,
        },
      });
    } catch {
      // Table journal pas encore créée : on ignore.
    }
  }
  return { id, restants };
}