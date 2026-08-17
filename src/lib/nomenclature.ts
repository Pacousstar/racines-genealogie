import type { SupabaseClient } from "@supabase/supabase-js";

export async function obtenirOuCreerQuartier(
  supabase: SupabaseClient,
  nom: string
): Promise<string | null> {
  const n = nom.trim();
  if (!n) return null;
  const { data: existant } = await supabase
    .from("quartiers")
    .select("id")
    .eq("nom", n)
    .maybeSingle();
  if (existant) return existant.id;
  const { data, error } = await supabase
    .from("quartiers")
    .insert({ nom: n })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}

export async function obtenirOuCreerFamille(
  supabase: SupabaseClient,
  nom: string,
  quartierId: string | null
): Promise<string | null> {
  // Le nom est stocké sans le préfixe « Famille » : on le retire pour que
  // « DIHI » et « Famille DIHI » désignent la même famille.
  const n = nom.trim().replace(/^Famille\s+/i, "");
  if (!n) return null;
  const { data: existant } = await supabase
    .from("familles")
    .select("id")
    .eq("quartier_id", quartierId)
    .eq("nom", n)
    .maybeSingle();
  if (existant) return existant.id;
  const { data, error } = await supabase
    .from("familles")
    .insert({ nom: n, quartier_id: quartierId })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}