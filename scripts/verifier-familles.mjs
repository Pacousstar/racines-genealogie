import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const ligne of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const [{ data: familles }, { data: quartiers }, { data: personnes }] = await Promise.all([
  supabase.from("familles").select("id,nom,quartier_id").order("nom"),
  supabase.from("quartiers").select("id,nom"),
  supabase.from("personnes").select("id,nom,prenom,famille_id"),
]);

const nomQuartier = new Map((quartiers ?? []).map((q) => [q.id, q.nom]));
console.log("FAMILLES en base :");
for (const f of familles ?? []) {
  console.log(`  "${f.nom}"  (quartier: ${nomQuartier.get(f.quartier_id) ?? "aucun"})`);
}

console.log("\nPersonnes rattachées à une famille :");
const nomFamille = new Map((familles ?? []).map((f) => [f.id, f.nom]));
for (const p of personnes ?? []) {
  if (p.famille_id) {
    console.log(`  ${p.prenom ?? ""} ${p.nom} -> "${nomFamille.get(p.famille_id) ?? "?"}"`);
  }
}