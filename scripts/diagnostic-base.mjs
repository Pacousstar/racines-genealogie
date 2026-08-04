import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function chargerEnv() {
  const env = {};
  for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
    const m = ligne.trim().match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/[\r"']/g, "").trim();
  }
  return env;
}

const env = chargerEnv();
const cle = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mode = env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon";
if (!cle) {
  console.error("Aucune clé supabase trouvée dans .env.local");
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, cle);

const { data: colonnes, error: errCol } = await supabase
  .from("information_schema.columns")
  .select("column_name")
  .eq("table_schema", "public")
  .eq("table_name", "personnes")
  .order("ordinal_position");

if (errCol) {
  console.error("Erreur colonnes :", errCol.message);
}

const colonnesPersonnes = (colonnes ?? []).map((c) => c.column_name);
console.log("Mode clé :", mode);
console.log("Colonnes personnes :", colonnesPersonnes.sort().join(", "));
console.log(
  "Nouvelles colonnes présentes ?",
  ["retraite", "residence", "crise_2010_2011"].every((c) =>
    colonnesPersonnes.includes(c)
  )
);

for (const table of ["profiles", "quartiers", "familles", "personnes", "unions", "enfants"]) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  console.log(`Table ${table} : ${error ? "ERREUR " + error.message : count} lignes`);
}

const { data: familles, error: errF } = await supabase
  .from("familles")
  .select("id,nom,quartier_id");
console.log(
  "Familles :",
  errF ? "ERREUR " + errF.message : familles?.map((f) => f.nom).join(", ") ?? "-"
);

const { data: quartiers, error: errQ } = await supabase
  .from("quartiers")
  .select("id,nom,ordre");
console.log(
  "Quartiers :",
  errQ ? "ERREUR " + errQ.message : quartiers?.map((q) => `${q.nom}(${q.ordre})`).join(", ") ?? "-"
);

const { data: personnes, error: errP } = await supabase
  .from("personnes")
  .select("nom,prenom,sexe,vivant,fiabilite");
if (errP) console.error("Erreur personnes :", errP.message);
else {
  console.log(`Personnes (${(personnes ?? []).length}) :`);
  for (const p of personnes ?? []) {
    console.log(`  - ${p.nom}${p.prenom ? " " + p.prenom : ""} [${p.sexe ?? "?"}] ${p.vivant ? "vivant" : "décédé"} · ${p.fiabilite}`);
  }
}