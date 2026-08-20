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
  return p ? `${p.prenom ?? ""} ${p.nom}`.trim() : `⚠ ID INCONNU ${id}`;
};

console.log(`Personnes : ${personnes.length} | Liens enfants : ${liens.length} | Unions : ${unions.length}`);

console.log("\n=== PERSONNES ORPHELINES (aucun lien de parenté, aucune union) ===");
const parentDe = new Set((liens ?? []).map((l) => l.parent_id));
const enfantDe = new Set((liens ?? []).map((l) => l.enfant_id));
const unionIds = new Set();
for (const u of unions ?? []) {
  unionIds.add(u.conjoint_1);
  unionIds.add(u.conjoint_2);
}
for (const p of personnes ?? []) {
  const isole =
    !parentDe.has(p.id) && !enfantDe.has(p.id) && !unionIds.has(p.id);
  if (isole) console.log(`- ${p.id}  ${nom(p.id)}  (créée ${p.created_at ?? "?"})`);
}

console.log("\n=== RÉFÉRENCES CASSÉES (vers des personnes supprimées) ===");
for (const l of liens ?? []) {
  if (!parId.has(l.parent_id)) {
    console.log(`- lien enfant ${l.id}: parent_id ${l.parent_id} INCONNU → enfant ${nom(l.enfant_id)}`);
  }
  if (!parId.has(l.enfant_id)) {
    console.log(`- lien enfant ${l.id}: enfant_id ${l.enfant_id} INCONNU → parent ${nom(l.parent_id)}`);
  }
}
for (const u of unions ?? []) {
  if (!parId.has(u.conjoint_1)) {
    console.log(`- union ${u.id}: conjoint_1 ${u.conjoint_1} INCONNU → avec ${nom(u.conjoint_2)}`);
  }
  if (!parId.has(u.conjoint_2)) {
    console.log(`- union ${u.id}: conjoint_2 ${u.conjoint_2} INCONNU → avec ${nom(u.conjoint_1)}`);
  }
}

console.log("\n=== PERSONNES QUI SONT ENFANTS DE PERSONNES INCONNUES ===");
for (const l of liens ?? []) {
  if (!parId.has(l.parent_id)) {
    console.log(`- ${nom(l.enfant_id)} a un parent inconnu (${l.parent_id})`);
  }
}

console.log("\n=== PERSONNES AVEC UN CONJOINT INCONNU ===");
for (const u of unions ?? []) {
  if (!parId.has(u.conjoint_1)) console.log(`- ${nom(u.conjoint_2)} ⚭ conjoint inconnu`);
  if (!parId.has(u.conjoint_2)) console.log(`- ${nom(u.conjoint_1)} ⚭ conjoint inconnu`);
}

console.log("\n=== PERSONNES DONT L'ENFANT EST INCONNU (supprimé) ===");
for (const l of liens ?? []) {
  if (!parId.has(l.enfant_id)) {
    console.log(`- ${nom(l.parent_id)} a un enfant supprimé (${l.enfant_id})`);
  }
}

console.log("\n=== RECHERCHE 'Edwige' / 'Dénise' / 'DIHI' ===");
for (const p of personnes ?? []) {
  const plein = `${p.prenom ?? ""} ${p.nom} ${p.surnom ?? ""}`;
  if (/edwige|dénise|denise|dihi/i.test(plein)) {
    console.log(`- ${p.id}  ${plein}`);
  }
}