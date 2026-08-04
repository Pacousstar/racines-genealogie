"use server";

import { createClient } from "@/lib/supabase/server";
import { obtenirOuCreerQuartier, obtenirOuCreerFamille } from "@/lib/nomenclature";

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
  enfants_ids: string[];
};

export type ResultatModification = { erreur?: string; id?: string };

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

  const { error } = await supabase
    .from("personnes")
    .update({
      nom,
      prenom: m.prenom.trim() || null,
      surnom: m.surnom.trim() || null,
      sexe: m.sexe,
      vivant: m.vivant,
      date_naissance: m.date_naissance.trim() || null,
      date_deces: m.date_deces.trim() || null,
      quartier_id: quartierId,
      famille_id: familleId,
      photo_url: m.photo_url ?? null,
      source: m.source,
      fiabilite: m.fiabilite,
    })
    .eq("id", id);

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
  }

  await supabase.from("enfants").delete().eq("parent_id", id);
  for (const enfantId of m.enfants_ids ?? []) {
    await supabase.from("enfants").insert({ parent_id: id, enfant_id: enfantId });
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
