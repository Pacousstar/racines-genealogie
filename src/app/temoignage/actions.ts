"use server";

import { createClient } from "@/lib/supabase/server";

export type ResultatTemoignage = { erreur?: string; id?: string };

export async function insererTemoignage(donnees: {
  personne_id: string;
  titre: string;
  audio_url: string;
  duree: number;
}): Promise<ResultatTemoignage> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Non connecté. Reconnectez-vous." };

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profil?.role;
  if (role !== "editeur" && role !== "admin") {
    return { erreur: "Réservé à un éditeur (CHO ou administrateur)." };
  }

  const { data, error } = await supabase
    .from("temoignages")
    .insert({
      personne_id: donnees.personne_id,
      titre: donnees.titre.trim() || null,
      audio_url: donnees.audio_url,
      duree: donnees.duree,
      cree_par: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (/does not exist|could not find/i.test(error.message)) {
      return {
        erreur:
          "La table des témoignages n'existe pas encore — lancez la migration scripts/migrations/temoignages.sql dans l'éditeur SQL de Supabase.",
      };
    }
    return { erreur: `Enregistrement impossible : ${error.message}` };
  }
  return { id: data.id };
}