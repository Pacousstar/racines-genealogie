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
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY manquante — collez la bonne clé dans .env.local."
  );
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const ordre = ["enfants", "unions", "personnes", "familles", "quartiers"];

for (const table of ordre) {
  const { data, count, error } = await supabase
    .from(table)
    .select("id", { count: "exact" });
  if (error) {
    console.error(`Table ${table} : ERREUR ${error.message}`);
    continue;
  }
  const ids = (data ?? []).map((r) => r.id);
  console.log(`Table ${table} : ${ids.length} lignes avant suppression`);
  if (ids.length === 0) continue;
  const { error: delErr } = await supabase.from(table).delete().in("id", ids);
  if (delErr) {
    console.error(`Table ${table} : suppression impossible — ${delErr.message}`);
  } else {
    console.log(`Table ${table} : ✓ vidée (${ids.length})`);
  }
}

const { data: photos, error: errPhotos } = await supabase.storage
  .from("photos")
  .list("public", { limit: 100 });
if (errPhotos) {
  console.error("Bucket photos : impossible de lister —", errPhotos.message);
} else {
  const chemins = (photos ?? [])
    .filter((f) => !f.id?.startsWith("."))
    .map((f) => `public/${f.name}`);
  if (chemins.length === 0) {
    console.log("Bucket photos : aucun fichier");
  } else {
    const { error: delErr } = await supabase.storage
      .from("photos")
      .remove(chemins);
    if (delErr) console.error("Bucket photos :", delErr.message);
    else console.log(`Bucket photos : ✓ vidé (${chemins.length})`);
  }
}