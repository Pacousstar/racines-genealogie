"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { obtenirOuCreerQuartier, obtenirOuCreerFamille } from "@/lib/nomenclature";
import type {
  DetailLienDeclaration,
  EnfantDeclaration,
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
  pere_id: string | null;
  mere_id: string | null;
  conjoint_id: string | null;
  nouveau_quartier: string;
  nouvelle_famille: string;
  retraite: boolean;
  residence: string;
  crise_2010_2011: boolean;
  est_ancetre: boolean;
  pere: DetailLienDeclaration;
  mere: DetailLienDeclaration;
  conjoint: DetailLienDeclaration;
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
    },
    id
  );

  if (error) {
    return { erreur: `Mise à jour impossible : ${error.message}` };
  }

  await supabase.from("enfants").delete().eq("enfant_id", id);

  const parents: Array<{
    cle: "pere_id" | "mere_id";
  }> = [{ cle: "pere_id" }, { cle: "mere_id" }];

  for (const { cle } of parents) {
    if (m[cle]) {
      await supabase.from("enfants").insert({ parent_id: m[cle], enfant_id: id });
      const detail = cle === "pere_id" ? m.pere : m.mere;
      await appliquerDetailLien(supabase, m[cle], detail);
    }
  }

  await supabase
    .from("unions")
    .delete()
    .or(`conjoint_1.eq.${id},conjoint_2.eq.${id}`);

  if (m.conjoint_id) {
    await supabase
      .from("unions")
      .insert({ conjoint_1: id, conjoint_2: m.conjoint_id, type: "mariage" });
    await appliquerDetailLien(supabase, m.conjoint_id, m.conjoint);
  }

  await supabase.from("enfants").delete().eq("parent_id", id);
  for (const [index, enfant] of (m.enfants ?? []).entries()) {
    await appliquerEnfant(supabase, enfant);
    await supabase
      .from("enfants")
      .insert({ parent_id: id, enfant_id: enfant.id, rang: index + 1 });
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
  return { id };
}

export async function supprimer(
  id: string
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

  const { error } = await supabase.from("personnes").delete().eq("id", id);
  if (error) {
    return { erreur: `Suppression impossible : ${error.message}` };
  }
  return { id };
}