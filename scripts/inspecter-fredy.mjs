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

const { data: personnes } = await supabase.from("personnes").select("*");
const { data: liens } = await supabase.from("enfants").select("*");
const { data: unions } = await supabase.from("unions").select("*");

const parId = new Map((personnes ?? []).map((p) => [p.id, p]));
const nom = (id) => {
  const p = parId.get(id);
  return p ? `${p.prenom ?? ""} ${p.nom}`.trim() : `INCONNU(${id})`;
};

const cibles = (personnes ?? []).filter((p) =>
  /fredy|degoue|edwige|happynes|apo|julie/i.test(`${p.prenom ?? ""} ${p.nom}`)
);

console.log("=== PERSONNES CONCERNÉES ===");
for (const p of cibles) {
  console.log(`- ${p.id}  ${p.prenom ?? ""} ${p.nom}  (créée ${p.created_at ?? "?"})`);
}

const ids = new Set(cibles.map((c) => c.id));

console.log("\n=== LEURS LIENS ENFANTS (tous) ===");
for (const l of liens ?? []) {
  if (ids.has(l.parent_id) || ids.has(l.enfant_id)) {
    console.log(`- ${nom(l.parent_id)}  →  ${nom(l.enfant_id)}  (rang ${l.rang ?? "?"}, lien ${l.id})`);
  }
}

console.log("\n=== LEURS UNIONS (toutes) ===");
for (const u of unions ?? []) {
  if (ids.has(u.conjoint_1) || ids.has(u.conjoint_2)) {
    console.log(`- ${nom(u.conjoint_1)}  ⚭  ${nom(u.conjoint_2)}  (union ${u.id})`);
  }
}

console.log("\n=== LIENS VERS/DEPUIS LES FREDY-DEGOUE depuis le reste du tableau ===");
for (const l of liens ?? []) {
  if ((ids.has(l.parent_id) && !ids.has(l.enfant_id)) || (!ids.has(l.parent_id) && ids.has(l.enfant_id))) {
    console.log(`- ${nom(l.parent_id)}  →  ${nom(l.enfant_id)}  (lien ${l.id})`);
  }
}
for (const u of unions ?? []) {
  if ((ids.has(u.conjoint_1) && !ids.has(u.conjoint_2)) || (!ids.has(u.conjoint_2) && ids.has(u.conjoint_1))) {
    console.log(`- ${nom(u.conjoint_1)}  ⚭  ${nom(u.conjoint_2)}  (union ${u.id})`);
  }
}