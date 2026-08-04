"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { obtenirOuCreerQuartier, obtenirOuCreerFamille } from "@/lib/nomenclature";
import type {
  DetailLienDeclaration,
  EnfantDeclaration,
} from "@/lib/types-declaration";

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
  pere: DetailLienDeclaration;
  mere: DetailLienDeclaration;
  conjoint: DetailLienDeclaration;
  enfants: EnfantDeclaration[];
  provisoireParents: boolean;
};

export type ResultatDeclaration = { erreur?: string; id?: string };

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
// n'ont pas encore été ajoutées dans Supabase — la déclaration reste possible.
const COLONNE_MANQUANTE = /column .* does not exist|could not find the column/i;

async function insererPersonne(
  supabase: SupabaseClient,
  champsBase: Record<string, unknown>,
  nouveauxChamps: Record<string, unknown>
): Promise<{ data: { id: string } | null; error: { message: string } | null }> {
  const essai = await supabase
    .from("personnes")
    .insert({ ...champsBase, ...nouveauxChamps })
    .select("id")
    .single();
  if (essai.error && COLONNE_MANQUANTE.test(essai.error.message)) {
    return supabase
      .from("personnes")
      .insert(champsBase)
      .select("id")
      .single();
  }
  return essai;
}

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

  const quartierId =
    (d.nouveau_quartier?.trim()
      ? await obtenirOuCreerQuartier(supabase, d.nouveau_quartier)
      : d.quartier_id) ?? null;

  const familleId =
    (d.nouvelle_famille?.trim()
      ? await obtenirOuCreerFamille(supabase, d.nouvelle_famille, quartierId)
      : d.famille_id) ?? null;

  const { data: pers, error } = await insererPersonne(
    supabase,
    {
      nom,
      prenom: d.prenom.trim() || null,
      surnom: d.surnom.trim() || null,
      sexe: d.sexe,
      vivant: d.vivant,
      date_naissance: d.date_naissance.trim() || null,
      date_deces: d.date_deces.trim() || null,
      quartier_id: quartierId,
      famille_id: familleId,
      photo_url: d.photo_url?.trim() || null,
      source: d.source,
      fiabilite: d.fiabilite,
    },
    {
      retraite: d.retraite,
      residence: d.residence.trim() || null,
      crise_2010_2011: d.crise_2010_2011,
    }
  );

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
      const detail = cle === "pere_id" ? d.pere : d.mere;
      await appliquerDetailLien(supabase, parentId, detail);
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
    await appliquerDetailLien(supabase, d.conjoint_id, d.conjoint);
  }

  for (const [index, enfant] of (d.enfants ?? []).entries()) {
    await appliquerEnfant(supabase, enfant);
    await supabase
      .from("enfants")
      .insert({ parent_id: id, enfant_id: enfant.id, rang: index + 1 });
  }

  return { id };
}