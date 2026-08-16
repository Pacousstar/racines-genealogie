import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: personnes } = await supabase
  .from("personnes")
  .select("id,nom,prenom,surnom,sexe,vivant,quartier_id,famille_id,est_ancetre")
  .order("nom");
const { data: liens } = await supabase
  .from("enfants")
  .select("parent_id,enfant_id,rang");
const { data: unions } = await supabase
  .from("unions")
  .select("conjoint_1,conjoint_2,date_union,rang");
const { data: quartiers } = await supabase.from("quartiers").select("id,nom");
const { data: familles } = await supabase.from("familles").select("id,nom");

const q = new Map((quartiers ?? []).map((x) => [x.id, x.nom]));
const f = new Map((familles ?? []).map((x) => [x.id, x.nom]));
const nom = (id) => {
  const p = (personnes ?? []).find((x) => x.id === id);
  if (!p) return `???(${id?.slice(0, 8)})`;
  return `${p.nom} ${p.prenom}${p.surnom ? ` (« ${p.surnom} »)` : ""}`;
};

console.log("=== PERSONNES ===");
for (const p of personnes ?? []) {
  console.log(
    `${p.id.slice(0, 8)} | ${p.nom} ${p.prenom}${p.surnom ? ` « ${p.surnom} »` : ""} | ${p.sexe} | quartier:${q.get(p.quartier_id) ?? "—"} | famille:${f.get(p.famille_id) ?? "—"}${p.est_ancetre ? " | ★ANCÊTRE" : ""}`
  );
}

console.log("\n=== LIENS ENFANT -> PARENT ===");
for (const l of liens ?? []) {
  console.log(`enfant ${nom(l.enfant_id)}  <--  parent ${nom(l.parent_id)} (rang ${l.rang ?? "—"})`);
}

console.log("\n=== UNIONS ===");
for (const u of unions ?? []) {
  console.log(`${nom(u.conjoint_1)}  ⚭  ${nom(u.conjoint_2)}${u.date_union ? ` (${u.date_union})` : ""}${u.rang != null ? ` [rang ${u.rang}]` : ""}`);
}
