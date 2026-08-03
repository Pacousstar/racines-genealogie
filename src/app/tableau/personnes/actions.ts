"use server";

import { createClient } from "@/lib/supabase/server";

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
  source: string;
  fiabilite: string;
  pere_id: string | null;
  mere_id: string | null;
  conjoint_id: string | null;
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
      quartier_id: m.quartier_id,
      famille_id: m.famille_id,
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
