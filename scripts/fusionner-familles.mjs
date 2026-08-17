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

const { data: familles } = await supabase
  .from("familles")
  .select("id,nom,quartier_id")
  .order("nom");

const sansPrefixe = familles?.find((f) => f.nom === "DIHI" && !/^famille\s+/i.test(f.nom));
const avecPrefixe = familles?.find((f) => f.nom === "Famille DIHI" || /^famille\s+/i.test(f.nom) && f.nom.endsWith("DIHI"));

if (!sansPrefixe) {
  console.error("Famille « DIHI » introuvable — rien à faire.");
  process.exit(1);
}
if (!avecPrefixe) {
  console.log("Aucun doublon « Famille DIHI » — rien à faire.");
  process.exit(0);
}

const { data: personnes } = await supabase
  .from("personnes")
  .select("id,nom,prenom,famille_id")
  .eq("famille_id", avecPrefixe.id);

console.log("Personnes à réaffecter :", (personnes ?? []).length);
for (const p of personnes ?? []) {
  console.log(`  ${p.prenom ?? ""} ${p.nom} (${p.id})`);
}

if (personnes && personnes.length > 0) {
  const ids = personnes.map((p) => p.id);
  const { error } = await supabase
    .from("personnes")
    .update({ famille_id: sansPrefixe.id })
    .in("id", ids);
  if (error) {
    console.error("Échec réaffectation :", error.message);
    process.exit(1);
  }
}

const { error: errSupp } = await supabase.from("familles").delete().eq("id", avecPrefixe.id);
if (errSupp) {
  console.error("Échec suppression doublon :", errSupp.message);
  process.exit(1);
}

console.log("Doublon « Famille DIHI » supprimé ; tous les membres sont sur « DIHI » (Gbéya).");

const { data: apres } = await supabase.from("familles").select("id,nom,quartier_id");
const { data: personnesApres } = await supabase
  .from("personnes")
  .select("id,nom,prenom,famille_id")
  .not("famille_id", "is", null);
const nomF = new Map((apres ?? []).map((f) => [f.id, f.nom]));
console.log("\nFamilles restantes :");
for (const f of apres ?? []) console.log(`  "${f.nom}"`);
console.log("\nPersonnes avec famille :");
for (const p of personnesApres ?? []) {
  console.log(`  ${p.prenom ?? ""} ${p.nom} -> "${nomF.get(p.famille_id)}"`);
}