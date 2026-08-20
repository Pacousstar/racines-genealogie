"use server";

import { createClient as createSupabase } from "@/lib/supabase/server";
import { createClientServiceRole } from "@/lib/service-role";

export type ResultatRestauration = { erreur?: string; nombre?: number };

const TABLES = [
  "personnes",
  "enfants",
  "unions",
  "quartiers",
  "familles",
  "temoignages",
  "journal",
] as const;

export async function restaurer(
  donnees: Record<string, unknown>
): Promise<ResultatRestauration> {
  const supabase = await createSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non connecté. Reconnectez-vous." };

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (prof?.role !== "editeur" && prof?.role !== "admin") {
    return { erreur: "Réservé à l'éditeur (CHO ou administrateur)." };
  }

  if (donnees?.application !== "racines-plus-toa-zeo" || !donnees?.donnees) {
    return { erreur: "Fichier invalide — ce n'est pas une sauvegarde Racines+." };
  }

  let admin;
  try {
    admin = createClientServiceRole();
  } catch {
    return {
      erreur:
        "La clé SUPABASE_SERVICE_ROLE_KEY n'est pas configurée sur ce serveur — la restauration est indisponible ici.",
    };
  }

  const entrant = donnees.donnees as Record<string, unknown[]>;
  let nombre = 0;

  for (const table of TABLES) {
    const lignes = entrant[table];
    if (!Array.isArray(lignes) || lignes.length === 0) continue;
    const { error } = await admin.from(table).upsert(lignes, { onConflict: "id" });
    if (error) {
      if (/does not exist|could not find/i.test(error.message)) continue;
      return { erreur: `Restauration de « ${table} » impossible : ${error.message}` };
    }
    nombre += lignes.length;
  }

  await supabase.from("journal").insert({
    action: "restauration",
    cible_type: "base",
    detail: { nombre },
  });

  return { nombre };
}