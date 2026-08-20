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

const { data: personnes } = await supabase
  .from("personnes")
  .select("id,nom,prenom,sexe,date_naissance,date_deces,vivant")
  .order("nom");

const { data: liens } = await supabase
  .from("enfants")
  .select("parent_id,enfant_id,rang");

const { data: unions } = await supabase
  .from("unions")
  .select("conjoint_1,conjoint_2,type,rang");

const parId = new Map((personnes ?? []).map((p) => [p.id, p]));
const nom = (id) => {
  const p = parId.get(id);
  return p ? `${p.prenom ?? ""} ${p.nom}`.trim() : `?${id.slice(0, 8)}`;
};

console.log("=== PERSONNES ===");
for (const p of personnes ?? []) {
  console.log(
    `${p.id} | ${p.sexe ?? "?"} | ${nom(p.id)} | né ${p.date_naissance ?? "?"}${p.vivant === false ? ` | décédé ${p.date_deces ?? "?"}` : ""}`
  );
}

console.log("\n=== LIENS PARENT -> ENFANT ===");
for (const l of liens ?? []) {
  console.log(`${nom(l.parent_id)}  ──>  ${nom(l.enfant_id)} (rang ${l.rang ?? "?"})`);
}

console.log("\n=== UNIONS ===");
for (const u of unions ?? []) {
  console.log(`${nom(u.conjoint_1)}  ⚭  ${nom(u.conjoint_2)} (${u.type ?? "?"}, rang ${u.rang ?? "?"})`);
}

console.log("\n=== ENFANTS DE CHACUN ===");
for (const p of personnes ?? []) {
  const enfants = (liens ?? []).filter((l) => l.parent_id === p.id);
  if (enfants.length > 0) {
    console.log(`${nom(p.id)} a pour enfants : ${enfants.map((e) => nom(e.enfant_id)).join(", ")}`);
  }
}