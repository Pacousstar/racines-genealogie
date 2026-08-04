"use server";

import { createClient } from "@/lib/supabase/server";

async function verifierEditeur(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; erreur?: string } | { erreur: string }> {
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
  return { supabase };
}

export async function ajouterQuartier(
  nom: string
): Promise<{ erreur?: string }> {
  const garde = await verifierEditeur();
  if ("erreur" in garde) return garde;
  const supabase = garde.supabase;

  const n = nom.trim();
  if (!n) return { erreur: "Saisissez un nom de quartier." };

  const { data: max } = await supabase
    .from("quartiers")
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1)
    .single();
  const ordre = (max?.ordre ?? 0) + 1;

  const { error } = await supabase.from("quartiers").insert({ nom: n, ordre });
  if (error) {
    return { erreur: `Impossible d'ajouter le quartier : ${error.message}` };
  }
  return {};
}

export async function modifierQuartier(
  id: string,
  nom: string,
  ordre: number
): Promise<{ erreur?: string }> {
  const garde = await verifierEditeur();
  if ("erreur" in garde) return garde;
  const supabase = garde.supabase;

  const n = nom.trim();
  if (!id || !n) return { erreur: "Nom de quartier obligatoire." };

  const { error } = await supabase
    .from("quartiers")
    .update({ nom: n, ordre: Number.isFinite(ordre) ? ordre : 0 })
    .eq("id", id);
  if (error) {
    return { erreur: `Mise à jour impossible : ${error.message}` };
  }
  return {};
}

export async function supprimerQuartier(
  id: string
): Promise<{ erreur?: string }> {
  const garde = await verifierEditeur();
  if ("erreur" in garde) return garde;
  const supabase = garde.supabase;

  if (!id) return { erreur: "Quartier inconnu." };

  const { error } = await supabase.from("quartiers").delete().eq("id", id);
  if (error) {
    return { erreur: `Suppression impossible : ${error.message}` };
  }
  return {};
}