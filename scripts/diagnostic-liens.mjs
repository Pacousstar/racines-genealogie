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

const { data: personnes, error: errP } = await supabase
  .from("personnes")
  .select("id,nom,prenom,sexe,vivant")
  .order("nom");
if (errP) {
  console.error("Erreur personnes :", errP.message);
  process.exit(1);
}

const parId = new Map(personnes.map((p) => [p.id, p]));
const nom = (id) => {
  const p = parId.get(id);
  return p ? `${p.nom}${p.prenom ? " " + p.prenom : ""} [${p.sexe ?? "?"}]` : `?? ${id}`;
};

for (const p of personnes) {
  const [parents, enfants, unions] = await Promise.all([
    supabase.from("enfants").select("parent_id").eq("enfant_id", p.id),
    supabase.from("enfants").select("enfant_id, rang").eq("parent_id", p.id).order("rang"),
    supabase
      .from("unions")
      .select("conjoint_1,conjoint_2")
      .or(`conjoint_1.eq.${p.id},conjoint_2.eq.${p.id}`),
  ]);
  const pIds = (parents.data ?? []).map((r) => r.parent_id);
  const eIds = (enfants.data ?? []).map((r) => r.enfant_id);
  const conjoint = (unions.data ?? []).map((u) =>
    u.conjoint_1 === p.id ? u.conjoint_2 : u.conjoint_1
  );
  console.log(
    `- ${p.nom}${p.prenom ? " " + p.prenom : ""} [${p.sexe ?? "?"}] (${p.id})`
  );
  console.log(
    `    parents: ${pIds.length ? pIds.map(nom).join(", ") : "AUCUN"}`
  );
  console.log(
    `    enfants: ${eIds.length ? eIds.map(nom).join(", ") : "AUCUN"}`
  );
  console.log(
    `    conjoint: ${conjoint.length ? conjoint.map(nom).join(", ") : "AUCUNE"}`
  );
}