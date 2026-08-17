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

const [{ data: personnes }, { data: liens }, { data: unions }] = await Promise.all([
  supabase.from("personnes").select("id,nom,prenom,sexe,date_naissance").order("nom"),
  supabase.from("enfants").select("parent_id,enfant_id,rang"),
  supabase.from("unions").select("conjoint_1,conjoint_2,date_union,rang"),
]);

const parId = new Map((personnes ?? []).map((p) => [p.id, p]));
const qui = (id) => {
  const p = parId.get(id);
  return p ? `${p.prenom ?? ""} ${p.nom ?? ""}`.trim() : `?${id.slice(0, 6)}`;
};
const enfantsDe = new Map();
const parentsDe = new Map();
for (const l of liens ?? []) {
  if (!enfantsDe.has(l.parent_id)) enfantsDe.set(l.parent_id, []);
  enfantsDe.get(l.parent_id).push({ enfant: l.enfant_id, rang: l.rang });
  if (!parentsDe.has(l.enfant_id)) parentsDe.set(l.enfant_id, []);
  parentsDe.get(l.enfant_id).push(l.parent_id);
}

console.log("=== UNIONS déclarées (rang) ===");
for (const u of unions ?? []) {
  const a = qui(u.conjoint_1), b = qui(u.conjoint_2);
  const enfantsCommuns = [];
  for (const e of enfantsDe.get(u.conjoint_1) ?? []) {
    if ((parentsDe.get(e.enfant) ?? []).includes(u.conjoint_2)) {
      enfantsCommuns.push(`${qui(e.enfant)} (rang ${e.rang})`);
    }
  }
  const enfantsDuCote1 = (enfantsDe.get(u.conjoint_1) ?? []).filter(
    (e) => !(parentsDe.get(e.enfant) ?? []).includes(u.conjoint_2)
  ).map((e) => `${qui(e.enfant)} (rang ${e.rang})`);
  console.log(`\n${a} ⚭ ${b}  [rang union: ${u.rang ?? "—"}, date: ${u.date_union ?? "—"}]`);
  console.log(`  enfants avec parents déclarés tous les deux : ${enfantsCommuns.join(", ") || "—"}`);
  console.log(`  enfants déclarés côté ${a} seul : ${enfantsDuCote1.join(", ") || "—"}`);
  const conjointsMere = [];
  for (const e of enfantsDe.get(u.conjoint_2) ?? []) {
    const autres = (parentsDe.get(e.enfant) ?? []).filter((p) => p !== u.conjoint_2);
    for (const autre of autres) if (autre !== u.conjoint_1) conjointsMere.push(`${qui(e.enfant)} [${qui(autre)}]`);
  }
  if (conjointsMere.length) console.log(`  ⚠ ${qui(u.conjoint_2)} a des enfants avec d'autres partenaires : ${conjointsMere.join(", ")}`);
}

console.log("\n=== vérification données enfants (rang) ===");
for (const [pid, liste] of enfantsDe) {
  if (!parId.get(pid)) continue;
  for (const e of liste) {
    const autres = (parentsDe.get(e.enfant) ?? []).filter((p) => p !== pid);
    console.log(`${qui(pid)} -> ${qui(e.enfant)} (rang ${e.rang ?? "—"}) | autres parents: ${autres.map(qui).join(", ") || "—"}`);
  }
}