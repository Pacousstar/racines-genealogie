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
if (!cle) {
  console.error("Aucune clé supabase trouvée dans .env.local");
  process.exit(1);
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, cle);

const parentId = "f7449f39-22fb-4ea7-934b-be88aadf0a3f"; // ANCETRE KILA
const enfantId = "bacd5fb4-145b-4d7d-972c-1f737b37d037"; // DIHI Tahidi dénis

const { data: existe, error: errEx } = await supabase
  .from("enfants")
  .select("parent_id")
  .eq("parent_id", parentId)
  .eq("enfant_id", enfantId);
if (errEx) {
  console.error("Vérification impossible :", errEx.message);
  process.exit(1);
}
if ((existe ?? []).length > 0) {
  console.log("Le lien ANCETRE KILA → Tahidi dénis existe déjà.");
  process.exit(0);
}

const { error } = await supabase
  .from("enfants")
  .insert({ parent_id: parentId, enfant_id: enfantId, rang: 1 });
if (error) {
  console.error("Erreur :", error.message);
  process.exit(1);
}
console.log("OK — ANCETRE KILA → Tahidi dénis relié (rang 1).");