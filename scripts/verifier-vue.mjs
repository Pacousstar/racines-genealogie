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

const [{ data: personnes }, { data: liens }, { data: unions }, { data: quartiers }, { data: familles }] =
  await Promise.all([
    supabase.from("personnes").select("id,nom,prenom,sexe,vivant,fiabilite,quartier_id,est_ancetre").order("nom"),
    supabase.from("enfants").select("parent_id,enfant_id,rang").order("rang", { ascending: true, nullsFirst: false }),
    supabase.from("unions").select("conjoint_1,conjoint_2,date_union,rang"),
    supabase.from("quartiers").select("id,nom"),
    supabase.from("familles").select("id,nom"),
  ]);

const parId = new Map((personnes ?? []).map((p) => [p.id, p]));
const qui = (id) => {
  const p = parId.get(id);
  return p ? `${p.prenom ?? ""} ${p.nom ?? ""}`.trim() : `?${id.slice(0, 6)}`;
};

console.log("COMPTES:", { personnes: personnes?.length, quartiers: quartiers?.length, familles: familles?.length, unions: unions?.length });

console.log("\nUNIONS:");
for (const u of unions ?? []) {
  console.log(`  ${qui(u.conjoint_1)} ⚭ ${qui(u.conjoint_2)}`);
}

console.log("\nLIENS parent -> enfant:");
for (const l of liens ?? []) {
  console.log(`  ${qui(l.parent_id)} -> ${qui(l.enfant_id)}`);
}

const stats = (id) => {
  const p = parId.get(id);
  if (!p) return;
  const conjoints = (unions ?? []).filter((u) => u.conjoint_1 === id || u.conjoint_2 === id).map((u) => (u.conjoint_1 === id ? u.conjoint_2 : u.conjoint_1));
  const parents = (liens ?? []).filter((l) => l.enfant_id === id).map((l) => l.parent_id);
  const enfants = (liens ?? []).filter((l) => l.parent_id === id).map((l) => l.enfant_id);
  const autreParentEnfant = (eid) => (liens ?? []).filter((l) => l.enfant_id === eid).map((l) => l.parent_id).filter((pid) => pid !== id);
  console.log(`\n${qui(id)} (ancetre=${p.est_ancetre})`);
  console.log("  conjoints:", conjoints.map(qui).join(", ") || "(aucun)");
  console.log("  parents:", parents.map(qui).join(", ") || "(aucun)");
  console.log("  enfants:", enfants.map((e) => `${qui(e)} [autre parent: ${autreParentEnfant(e).map(qui).join(", ") || "—"}]`).join(" | ") || "(aucun)");
};

for (const id of ["bacd5fb4-145b-4d7d-972c-1f737b37d037"]) stats(id);
const tahidi = (personnes ?? []).find((p) => p.nom === "DIHI" && p.prenom?.toLowerCase().includes("tahidi"));
const sobre = (personnes ?? []).find((p) => p.nom === "DIHI" && p.prenom?.toLowerCase().includes("sobre"));
const kila = (personnes ?? []).find((p) => p.prenom?.toLowerCase().includes("kila"));
for (const p of [kila, tahidi, sobre]) if (p) stats(p.id);
