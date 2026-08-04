import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.trim().match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/[\r"']/g, "").trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const noms = ["Gaho", "Bogné", "Bogné-Zagna", "Gbéha", "Zouahé"];

for (const [index, nom] of noms.entries()) {
  const { error } = await supabase.from("quartiers").upsert(
    { nom, ordre: index + 1 },
    { onConflict: "nom" }
  );
  if (error) console.error(`${nom} : ERREUR ${error.message}`);
  else console.log(`${nom} (ordre ${index + 1}) : ✓`);
}

const { data: liste, error } = await supabase
  .from("quartiers")
  .select("id,nom,ordre")
  .order("ordre");
if (error) console.error("Lecture :", error.message);
else console.log("Quartiers en base :", liste.map((q) => `${q.nom}(${q.ordre})`).join(", "));