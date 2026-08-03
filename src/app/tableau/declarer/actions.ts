"use server";

import { createClient } from "@/lib/supabase/server";

export type Declaration = {
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
  provisoireParents: boolean;
};

export type ResultatDeclaration = { erreur?: string; id?: string };

export async function declarer(
  d: Declaration
): Promise<ResultatDeclaration> {
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

  const nom = d.nom.trim();
  if (!nom) return { erreur: "Le nom est obligatoire." };

  const { data: pers, error } = await supabase
    .from("personnes")
    .insert({
      nom,
      prenom: d.prenom.trim() || null,
      surnom: d.surnom.trim() || null,
      sexe: d.sexe,
      vivant: d.vivant,
      date_naissance: d.date_naissance.trim() || null,
      date_deces: d.date_deces.trim() || null,
      quartier_id: d.quartier_id,
      famille_id: d.famille_id,
      source: d.source,
      fiabilite: d.fiabilite,
    })
    .select("id")
    .single();

  if (error || !pers) {
    return { erreur: `Enregistrement impossible : ${error?.message ?? "erreur inconnue"}` };
  }
  const id = pers.id;

  const parents: Array<{
    cle: "pere_id" | "mere_id";
    nomProvisoire: string;
    sexeProvisoire: "M" | "F";
  }> = [
    { cle: "pere_id", nomProvisoire: "Père inconnu", sexeProvisoire: "M" },
    { cle: "mere_id", nomProvisoire: "Mère inconnue", sexeProvisoire: "F" },
  ];

  for (const { cle, nomProvisoire, sexeProvisoire } of parents) {
    let parentId = d[cle];
    if (!parentId && d.provisoireParents) {
      const { data: prov, error: errProv } = await supabase
        .from("personnes")
        .insert({
          nom: nomProvisoire,
          sexe: sexeProvisoire,
          fiabilite: "en cours",
          source: d.source,
        })
        .select("id")
        .single();
      if (!errProv && prov) parentId = prov.id;
    }
    if (parentId) {
      await supabase.from("enfants").insert({ parent_id: parentId, enfant_id: id });
    }
  }

  if (d.conjoint_id) {
    await supabase
      .from("unions")
      .insert({
        conjoint_1: id,
        conjoint_2: d.conjoint_id,
        type: "mariage",
      });
  }

  return { id };
}