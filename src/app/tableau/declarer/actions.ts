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

function champsNouveau(n: PersonneNouvelle, source: string) {
  return {
    nom: n.nom.trim(),
    prenom: n.prenom?.trim() || null,
    sexe: n.sexe,
    vivant: !n.decede,
    date_naissance: n.date_naissance?.trim() || null,
    date_deces: n.decede ? n.date_deces?.trim() || null : null,
    fiabilite: "confirmé",
    source,
  };
}

async function creerPersonne(
  supabase: SupabaseClient,
  n: PersonneNouvelle,
  source: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("personnes")
    .insert(champsNouveau(n, source))
    .select("id")
    .single();
  return error || !data ? null : data.id;
}

// Repli si les nouvelles colonnes (retraite, residence, crise_2010_2011)
// n'ont pas encore été ajoutées dans Supabase — la déclaration reste possible.
const COLONNE_MANQUANTE = /column .* does not exist|could not find the column/i;

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
      est_ancetre: d.est_ancetre,
    },
    {
      retraite: d.retraite,
      residence: d.residence.trim() || null,
      crise_2010_2011: d.crise_2010_2011,
      profession: d.profession?.trim() || null,
      religion: d.religion?.trim() || null,
    }
  );

  if (error || !pers) {
    return { erreur: `Enregistrement impossible : ${error?.message ?? "erreur inconnue"}` };
  }
  const id = pers.id;

  const parents: Array<{
    cle: "pere_id" | "mere_id";
    nouveau: PersonneNouvelle | null;
    nomProvisoire: string;
    sexeProvisoire: "M" | "F";
  }> = [
    {
      cle: "pere_id",
      nouveau: d.pere_nouveau,
      nomProvisoire: "Père inconnu",
      sexeProvisoire: "M",
    },
    {
      cle: "mere_id",
      nouveau: d.mere_nouveau,
      nomProvisoire: "Mère inconnue",
      sexeProvisoire: "F",
    },
  ];

  for (const { cle, nouveau, nomProvisoire, sexeProvisoire } of parents) {
    let parentId = d[cle];
    if (!parentId && nouveau?.nom?.trim()) {
      parentId = await creerPersonne(supabase, nouveau, d.source);
    }
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
      if (nouveau?.nom?.trim()) {
        if (nouveau.decede) {
          await supabase
            .from("personnes")
            .update({ vivant: false, date_deces: nouveau.date_deces.trim() || null })
            .eq("id", parentId);
        }
      } else {
        await appliquerDetailLien(supabase, parentId, detail);
      }
    }
  }

  // Conjoint(e)s : plusieurs représentants possibles. Le premier déclaré
  // (rang 0) devient le conjoint principal dans l'arbre.
  for (const [i, conjoint] of (d.conjoints ?? []).entries()) {
    let conjointId = conjoint.id;
    if (!conjointId && conjoint.nouveau?.nom?.trim()) {
      conjointId = await creerPersonne(supabase, conjoint.nouveau, d.source);
    }
    if (!conjointId) continue;
    const erreurUnion = await insererUnion(supabase, id, conjointId, i);
    if (erreurUnion) {
      return {
        erreur: `L'union avec le conjoint n°${i + 1} n'a pas pu être enregistrée : ${erreurUnion}`,
      };
    }
    if (!conjoint.id) {
      if (conjoint.nouveau?.decede) {
        await supabase
          .from("personnes")
          .update({
            vivant: false,
            date_deces: conjoint.nouveau.date_deces.trim() || null,
          })
          .eq("id", conjointId);
      }
    } else {
      await appliquerDetailLien(supabase, conjointId, conjoint.detail);
    }
  }

  for (const [index, enfant] of (d.enfants ?? []).entries()) {
    let enfantId = enfant.id;
    if (!enfantId && enfant.nouveau?.nom?.trim()) {
      enfantId = await creerPersonne(supabase, enfant.nouveau, d.source);
    }
    if (!enfantId) continue;
    const enfantFinal = { ...enfant, id: enfantId };
    await appliquerEnfant(supabase, enfantFinal);
    await supabase
      .from("enfants")
      .insert({ parent_id: id, enfant_id: enfantId, rang: index + 1 });

    // L'autre parent de l'enfant (l'autre de la personne déclarée) : c'est
    // lui/elle qui permet de distinguer « les enfants de X et de Y ».
    let autreParentId = enfant.autre_parent_id;
    if (!autreParentId && enfant.autre_parent_nouveau?.nom?.trim()) {
      autreParentId = await creerPersonne(
        supabase,
        enfant.autre_parent_nouveau,
        d.source
      );
    }
    if (autreParentId) {
      await supabase
        .from("enfants")
        .insert({ parent_id: autreParentId, enfant_id: enfantId, rang: index + 1 });
    }
  }

  // Journal des changements (si la table existe — migration enrichissement.sql)
  try {
    await supabase.from("journal").insert({
      action: "declaration",
      cible_type: "personne",
      cible_id: id,
      detail: { nom: d.nom.trim(), prenom: d.prenom.trim() || null },
    });
  } catch {
    // Table journal pas encore créée : on ignore.
  }

  return { id };
}

// Vérification de doublons avant enregistrement.
export async function verifierDoublons(
  nom: string,
  prenom: string,
  idExclu: string | null
): Promise<{ doublons: { id: string; nom: string; prenom: string | null }[] }> {
  const supabase = await createClient();
  const nomNettoye = nom.trim();
  const prenomNettoye = prenom.trim();
  if (!nomNettoye) return { doublons: [] };

  let requete = supabase
    .from("personnes")
    .select("id,nom,prenom")
    .ilike("nom", nomNettoye);
  if (prenomNettoye) {
    requete = requete.ilike("prenom", prenomNettoye);
  }
  if (idExclu) {
    requete = requete.neq("id", idExclu);
  }
  const { data } = await requete.limit(10);
  return {
    doublons: (data ?? []).map((p) => ({ id: p.id, nom: p.nom, prenom: p.prenom })),
  };
}